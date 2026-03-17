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

    if (!resolvedAppPublicUrl) {
      throw new InternalServerErrorException("App public url is not configured")
    }

    return `${resolvedAppPublicUrl}/signup/complete?token=${encodeURIComponent(token)}`
  }

  async sendSignUpLink({
    appPublicUrl,
    email,
    token,
  }: {
    appPublicUrl?: string
    email: string
    token: string
  }) {
    const verificationUrl = this.getSignUpLink({
      appPublicUrl,
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
}
