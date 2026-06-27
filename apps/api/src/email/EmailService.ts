import {
  Injectable,
  InternalServerErrorException,
  Logger,
  type OnModuleDestroy,
} from "@nestjs/common"
import nodemailer, { type Transporter } from "nodemailer"
import { AppConfigService } from "../config/AppConfigService"

@Injectable()
export class EmailService implements OnModuleDestroy {
  private readonly logger = new Logger(EmailService.name)
  private transporter: Transporter | undefined

  constructor(private readonly appConfigService: AppConfigService) {}

  onModuleDestroy() {
    this.transporter?.close()
    this.transporter = undefined
  }

  /**
   * Returns a single pooled transporter, reused across every email.
   *
   * Pooling keeps a small set of SMTP connections open and paces messages
   * through them instead of opening (and leaking) a fresh connection per
   * email. This avoids provider throttling/refusals on large broadcasts and
   * removes the SMTP handshake cost from each transactional send.
   */
  private getTransporter() {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: this.appConfigService.EMAIL_SMTP_HOST,
        port: this.appConfigService.EMAIL_SMTP_PORT,
        secure: this.appConfigService.EMAIL_SMTP_PORT === 465,
        pool: true,
        maxConnections: 5,
        maxMessages: 100,
        auth:
          this.appConfigService.EMAIL_SMTP_USER &&
          this.appConfigService.EMAIL_SMTP_PASSWORD
            ? {
                user: this.appConfigService.EMAIL_SMTP_USER,
                pass: this.appConfigService.EMAIL_SMTP_PASSWORD,
              }
            : undefined,
      })
    }

    return this.transporter
  }

  /**
   * Sends an email to a single recipient.
   *
   * In development, when SMTP is not configured, the email is logged instead
   * of being delivered. In production an unconfigured SMTP throws.
   */
  async sendEmail({
    to,
    subject,
    text,
    html,
  }: {
    to: string
    subject: string
    text: string
    html?: string
  }) {
    if (
      !this.appConfigService.EMAIL_SMTP_HOST ||
      !this.appConfigService.EMAIL_FROM
    ) {
      if (this.appConfigService.NODE_ENV === "development") {
        this.logger.log(`Email to ${to} (${subject}):\n${text}`)
        return
      }

      throw new InternalServerErrorException("Email delivery is not configured")
    }

    await this.getTransporter().sendMail({
      from: this.appConfigService.EMAIL_FROM,
      to,
      subject,
      text,
      html,
    })
  }

  getSignUpLink({
    appPublicUrl,
    token,
  }: {
    appPublicUrl?: string
    token: string
  }) {
    const resolvedAppPublicUrl =
      appPublicUrl ?? this.appConfigService.APP_PUBLIC_URL

    return `${resolvedAppPublicUrl}/signup/complete?token=${encodeURIComponent(token)}`
  }

  async sendSignUpLink({ email, token }: { email: string; token: string }) {
    const verificationUrl = this.getSignUpLink({
      token,
    })

    await this.sendEmail({
      to: email,
      subject: "Complete your Oboku sign up",
      text: `Complete your Oboku sign up by opening this link: ${verificationUrl}`,
      html: `<p>Complete your Oboku sign up.</p><p><a href="${verificationUrl}">Click here to complete sign up</a></p>`,
    })
  }

  getMagicLink({
    appPublicUrl,
    token,
  }: {
    appPublicUrl?: string
    token: string
  }) {
    const resolvedAppPublicUrl =
      appPublicUrl ?? this.appConfigService.APP_PUBLIC_URL

    return `${resolvedAppPublicUrl}/login/magic-link?token=${encodeURIComponent(token)}`
  }

  async sendMagicLink({ email, token }: { email: string; token: string }) {
    const magicLinkUrl = this.getMagicLink({
      token,
    })

    await this.sendEmail({
      to: email,
      subject: "Complete your Oboku sign in",
      text: `Open this link to verify your email and sign in to Oboku: ${magicLinkUrl}`,
      html: `<p>Use this one-time sign-in link to verify your email and sign in to Oboku.</p><p><a href="${magicLinkUrl}">Click here to continue</a></p>`,
    })
  }
}
