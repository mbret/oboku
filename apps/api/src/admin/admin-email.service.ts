import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from "@nestjs/common"
import {
  renderBroadcastEmail,
  type SendAdminEmailRequest,
  type SendAdminEmailResponse,
} from "@oboku/shared"
import { EMAIL_MAX_CONNECTIONS, EmailService } from "src/email/EmailService"
import {
  normalizeAudienceEmails,
  UserPostgresService,
} from "src/features/postgres/user-postgres.service"

const logger = new Logger("AdminEmailService")

const SEND_CONCURRENCY = EMAIL_MAX_CONNECTIONS

@Injectable()
export class AdminEmailService {
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

    logger.log(
      `Admin email broadcast requested: subject="${subject}" ` +
        `audience=${input.audienceType}`,
    )

    if (this.broadcastInFlight) {
      logger.warn(
        "Rejected broadcast request: another broadcast is already in flight",
      )
      throw new ConflictException(
        "A broadcast is already in progress. Wait for it to finish before sending another.",
      )
    }
    this.broadcastInFlight = true

    try {
      logger.log("Resolving recipients...")
      const recipients = await this.resolveRecipients(input)
      logger.log(`Resolved ${recipients.length} recipient(s)`)

      if (recipients.length === 0) {
        throw new BadRequestException("There are no recipients to email")
      }

      logger.log("Verifying SMTP transport...")
      await this.emailService.verifyTransport()
      logger.log("SMTP transport verified")

      const html = renderBroadcastEmail({ body })

      logger.log(
        `Admin email broadcast starting: subject="${subject}" ` +
          `audience=${input.audienceType} recipients=${recipients.length}`,
      )

      void this.runBroadcast(recipients, {
        subject,
        body,
        html,
        audienceType: input.audienceType,
      })
        .catch((error) => {
          logger.error(
            "Admin email broadcast crashed unexpectedly",
            error instanceof Error ? error.stack : error,
          )
        })
        .finally(() => {
          this.broadcastInFlight = false
        })

      logger.log(
        `Broadcast accepted and running in background for ${recipients.length} recipient(s)`,
      )

      return { recipientCount: recipients.length }
    } catch (error) {
      // The conflict check stays outside this try so it can't clear the slot of
      // the broadcast already in flight; here we only release the slot we claimed.
      logger.error(
        "Admin email broadcast failed before dispatch",
        error instanceof Error ? error.stack : error,
      )
      this.broadcastInFlight = false
      throw error
    }
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

    // Log progress at ~10% intervals (at least every 25 emails) so large
    // broadcasts are observable without logging every single send.
    const progressStep = Math.max(25, Math.ceil(recipients.length / 10))
    let nextProgressAt = progressStep

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

        const processed = deliveredCount + failedCount
        if (processed >= nextProgressAt) {
          nextProgressAt += progressStep
          logger.log(
            `Broadcast progress: ${processed}/${recipients.length} ` +
              `(${deliveredCount} delivered, ${failedCount} failed)`,
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
