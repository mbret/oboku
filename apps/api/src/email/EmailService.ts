import {
  Injectable,
  InternalServerErrorException,
  Logger,
  type OnModuleDestroy,
} from "@nestjs/common"
import { renderMagicLinkEmail, renderSignUpEmail } from "@oboku/shared"
import nodemailer, { type Transporter } from "nodemailer"
import { AppConfigService } from "../config/AppConfigService"

export const EMAIL_MAX_CONNECTIONS = 5

const EMAIL_MAX_MESSAGES_PER_CONNECTION = 100

@Injectable()
export class EmailService implements OnModuleDestroy {
  private readonly logger = new Logger(EmailService.name)
  private transporter: Transporter | undefined

  constructor(private readonly appConfigService: AppConfigService) {}

  onModuleDestroy() {
    this.transporter?.close()
    this.transporter = undefined
  }

  private getTransporter() {
    if (!this.transporter) {
      const maxSendRate = this.appConfigService.EMAIL_SMTP_MAX_SEND_RATE

      this.transporter = nodemailer.createTransport({
        host: this.appConfigService.EMAIL_SMTP_HOST,
        port: this.appConfigService.EMAIL_SMTP_PORT,
        secure: this.appConfigService.EMAIL_SMTP_PORT === 465,
        pool: true,
        maxConnections: EMAIL_MAX_CONNECTIONS,
        maxMessages: EMAIL_MAX_MESSAGES_PER_CONNECTION,
        ...(maxSendRate ? { rateDelta: 1000, rateLimit: maxSendRate } : {}),
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
    const fromAddress = this.appConfigService.EMAIL_FROM

    if (!this.appConfigService.EMAIL_SMTP_HOST || !fromAddress) {
      if (this.appConfigService.NODE_ENV === "development") {
        this.logger.log(`Email to ${to} (${subject}):\n${text}`)
        return
      }

      throw new InternalServerErrorException("Email delivery is not configured")
    }

    await this.getTransporter().sendMail({
      from: {
        name: this.appConfigService.EMAIL_FROM_NAME,
        address: fromAddress,
      },
      to,
      subject,
      text,
      html,
    })
  }

  async verifyTransport() {
    if (
      !this.appConfigService.EMAIL_SMTP_HOST ||
      !this.appConfigService.EMAIL_FROM
    ) {
      if (this.appConfigService.NODE_ENV === "development") {
        return
      }

      throw new InternalServerErrorException("Email delivery is not configured")
    }

    try {
      await this.getTransporter().verify()
    } catch (error) {
      this.logger.error(
        "SMTP transport verification failed",
        error instanceof Error ? error.stack : error,
      )

      throw new InternalServerErrorException(
        "Email delivery is currently unavailable",
      )
    }
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
      subject: "Complete your oboku sign up",
      text: `Welcome to oboku! Complete your sign up by opening this link: ${verificationUrl}`,
      html: renderSignUpEmail({ url: verificationUrl }),
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
      subject: "Your oboku sign-in link",
      text: `Open this link to verify your email and sign in to oboku: ${magicLinkUrl}`,
      html: renderMagicLinkEmail({ url: magicLinkUrl }),
    })
  }
}
