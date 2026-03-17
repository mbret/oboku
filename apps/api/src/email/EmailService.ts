import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from "@nestjs/common"
import nodemailer from "nodemailer"
import { AppConfigService } from "../config/AppConfigService"

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name)

  constructor(private readonly appConfigService: AppConfigService) {}

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

    if (
      !this.appConfigService.EMAIL_SMTP_HOST ||
      !this.appConfigService.EMAIL_FROM
    ) {
      if (this.appConfigService.NODE_ENV === "development") {
        this.logger.log(
          `Email verification link for ${email}: ${verificationUrl}`,
        )
        return
      }

      throw new InternalServerErrorException("Email delivery is not configured")
    }

    const transporter = nodemailer.createTransport({
      host: this.appConfigService.EMAIL_SMTP_HOST,
      port: this.appConfigService.EMAIL_SMTP_PORT,
      secure: this.appConfigService.EMAIL_SMTP_PORT === 465,
      auth:
        this.appConfigService.EMAIL_SMTP_USER &&
        this.appConfigService.EMAIL_SMTP_PASSWORD
          ? {
              user: this.appConfigService.EMAIL_SMTP_USER,
              pass: this.appConfigService.EMAIL_SMTP_PASSWORD,
            }
          : undefined,
    })

    await transporter.sendMail({
      from: this.appConfigService.EMAIL_FROM,
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

    if (
      !this.appConfigService.EMAIL_SMTP_HOST ||
      !this.appConfigService.EMAIL_FROM
    ) {
      if (this.appConfigService.NODE_ENV === "development") {
        this.logger.log(`Magic sign-in link for ${email}: ${magicLinkUrl}`)
        return
      }

      throw new InternalServerErrorException("Email delivery is not configured")
    }

    const transporter = nodemailer.createTransport({
      host: this.appConfigService.EMAIL_SMTP_HOST,
      port: this.appConfigService.EMAIL_SMTP_PORT,
      secure: this.appConfigService.EMAIL_SMTP_PORT === 465,
      auth:
        this.appConfigService.EMAIL_SMTP_USER &&
        this.appConfigService.EMAIL_SMTP_PASSWORD
          ? {
              user: this.appConfigService.EMAIL_SMTP_USER,
              pass: this.appConfigService.EMAIL_SMTP_PASSWORD,
            }
          : undefined,
    })

    await transporter.sendMail({
      from: this.appConfigService.EMAIL_FROM,
      to: email,
      subject: "Complete your Oboku sign in",
      text: `Open this link to verify your email and sign in to Oboku: ${magicLinkUrl}`,
      html: `<p>Use this one-time sign-in link to verify your email and sign in to Oboku.</p><p><a href="${magicLinkUrl}">Click here to continue</a></p>`,
    })
  }
}
