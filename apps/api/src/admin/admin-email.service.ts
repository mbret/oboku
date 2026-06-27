import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from "@nestjs/common"
import type {
  SendAdminEmailRequest,
  SendAdminEmailResponse,
} from "@oboku/shared"
import { EMAIL_MAX_CONNECTIONS, EmailService } from "src/email/EmailService"
import {
  normalizeAudienceEmails,
  UserPostgresService,
} from "src/features/postgres/user-postgres.service"

const logger = new Logger("AdminEmailService")

/**
 * Workers dispatching emails in parallel. Matched to the SMTP pool's connection
 * count, which is the real throughput ceiling — more workers would just queue
 * behind the same connections. When a max send rate is configured the pool also
 * paces sends below that rate regardless of this number.
 */
const SEND_CONCURRENCY = EMAIL_MAX_CONNECTIONS

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")

@Injectable()
export class AdminEmailService {
  /**
   * True while a broadcast is being dispatched or sent in the background.
   * Blocks a concurrent broadcast so double-submits can't fan out duplicates.
   * Per process only — it does not coordinate across multiple API instances.
   */
  private broadcastInFlight = false

  constructor(
    private readonly userPostgresService: UserPostgresService,
    private readonly emailService: EmailService,
  ) {}

  private async resolveRecipients(
    input: SendAdminEmailRequest,
  ): Promise<string[]> {
    if (input.audienceType === "all") {
      return this.userPostgresService.getAllUserEmails()
    }

    return normalizeAudienceEmails(
      input.emails,
      "At least one email is required for targeted emails",
    )
  }

  /**
   * Validates the request, resolves recipients, and verifies email delivery is
   * usable synchronously (so validation errors, an unusable transport, and the
   * recipient count all surface to the caller), then sends in the background
   * and returns immediately. The broadcast can take minutes for a large
   * audience, which would otherwise outlast the HTTP request timeout.
   *
   * Rejects with a conflict while another broadcast is already in flight, so a
   * double-submit cannot dispatch duplicates.
   */
  async sendBroadcast(
    input: SendAdminEmailRequest,
  ): Promise<SendAdminEmailResponse> {
    const subject = input.subject.trim()
    const body = input.body.trim()

    if (!subject) {
      throw new BadRequestException("Subject is required")
    }

    if (!body) {
      throw new BadRequestException("Body is required")
    }

    const recipients = await this.resolveRecipients(input)

    if (recipients.length === 0) {
      throw new BadRequestException("There are no recipients to email")
    }

    // Delivery runs in the background, so a totally-down or misconfigured SMTP
    // would otherwise return 202 ("broadcast started") while every message
    // silently fails and the operator loses the draft. Verify the transport up
    // front so systemic failures surface as an error response; per-recipient
    // rejections still can't be reported here and remain logged in runBroadcast.
    await this.emailService.verifyTransport()

    const html = `<p>${escapeHtml(body).replace(/\n/g, "<br />")}</p>`

    logger.log(
      `Admin email broadcast starting: subject="${subject}" ` +
        `audience=${input.audienceType} recipients=${recipients.length}`,
    )

    // Block duplicate broadcasts from double-submits (double-click, React
    // re-fire, retries). We return 202 before the background send finishes, so
    // the client's pending state can't cover the broadcast's lifetime — only
    // this flag can. The check and the set are adjacent (no await between), so
    // two racing requests can't both claim the slot.
    if (this.broadcastInFlight) {
      throw new ConflictException(
        "A broadcast is already in progress. Wait for it to finish before sending another.",
      )
    }
    this.broadcastInFlight = true

    // Fire and forget: runBroadcast owns all of its own error handling, so this
    // floating promise can never reject and crash the process. Its finally
    // releases the in-flight slot when delivery completes.
    void this.runBroadcast(recipients, {
      subject,
      body,
      html,
      audienceType: input.audienceType,
    }).finally(() => {
      this.broadcastInFlight = false
    })

    return { recipientCount: recipients.length }
  }

  private async runBroadcast(
    recipients: string[],
    content: {
      subject: string
      body: string
      html: string
      audienceType: SendAdminEmailRequest["audienceType"]
    },
  ): Promise<void> {
    let deliveredCount = 0
    let failedCount = 0
    let cursor = 0

    const worker = async () => {
      while (cursor < recipients.length) {
        const index = cursor
        cursor += 1
        const to = recipients[index]

        if (!to) {
          continue
        }

        try {
          await this.emailService.sendEmail({
            to,
            subject: content.subject,
            text: content.body,
            html: content.html,
          })
          deliveredCount += 1
        } catch (error) {
          failedCount += 1
          logger.error(
            `Failed to send admin email to ${to}`,
            error instanceof Error ? error.stack : error,
          )
        }
      }
    }

    await Promise.all(
      Array.from(
        { length: Math.min(SEND_CONCURRENCY, recipients.length) },
        worker,
      ),
    )

    logger.log(
      `Admin email broadcast finished: subject="${content.subject}" ` +
        `audience=${content.audienceType} ${deliveredCount} delivered, ` +
        `${failedCount} failed of ${recipients.length}`,
    )
  }
}
