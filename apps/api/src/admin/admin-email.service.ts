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

    const results = await Promise.allSettled(
      recipients.map((to) =>
        this.emailService.sendEmail({ to, subject, text: body, html }),
      ),
    )

    let deliveredCount = 0
    let failedCount = 0

    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        deliveredCount += 1
      } else {
        failedCount += 1
        logger.error(
          `Failed to send admin email to ${recipients[index]}`,
          result.reason instanceof Error ? result.reason.stack : result.reason,
        )
      }
    })

    return {
      recipientCount: recipients.length,
      deliveredCount,
      failedCount,
    }
  }
}
