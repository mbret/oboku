import { BadRequestException, Injectable, Logger } from "@nestjs/common"
import type {
  SendAdminEmailRequest,
  SendAdminEmailResponse,
} from "@oboku/shared"
import { EmailService } from "src/email/EmailService"
import {
  normalizeEmail,
  UserPostgresService,
} from "src/features/postgres/user-postgres.service"

const logger = new Logger("AdminEmailService")

/** Max emails in flight at once. The pooled transporter is the real ceiling. */
const SEND_CONCURRENCY = 10

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")

@Injectable()
export class AdminEmailService {
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

    const emails = [
      ...new Set((input.emails ?? []).map(normalizeEmail)),
    ].filter((email) => email.length > 0)

    if (emails.length === 0) {
      throw new BadRequestException(
        "At least one email is required for targeted emails",
      )
    }

    return emails
  }

  /**
   * Validates the request and resolves recipients synchronously (so validation
   * errors and the recipient count surface to the caller), then sends in the
   * background and returns immediately. The broadcast can take minutes for a
   * large audience, which would otherwise outlast the HTTP request timeout.
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

    const html = `<p>${escapeHtml(body).replace(/\n/g, "<br />")}</p>`

    // Fire and forget: runBroadcast owns all of its own error handling, so this
    // floating promise can never reject and crash the process.
    void this.runBroadcast(recipients, { subject, body, html })

    return { recipientCount: recipients.length }
  }

  private async runBroadcast(
    recipients: string[],
    content: { subject: string; body: string; html: string },
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
      `Admin email broadcast finished: ${deliveredCount} delivered, ` +
        `${failedCount} failed of ${recipients.length}`,
    )
  }
}
