import type { AppConfigService } from "../config/AppConfigService.js"
import { getEmailSenderAddress } from "../email/EmailService.js"
import type { SendToKindleConfigDto } from "./kindle.dto.js"

export const toSendToKindleConfig = (
  config: Pick<
    AppConfigService,
    | "EMAIL_SMTP_HOST"
    | "EMAIL_FROM"
    | "SEND_TO_KINDLE_MAX_FILE_SIZE_BYTES"
    | "SEND_TO_KINDLE_MAX_SENDS_PER_DAY"
  >,
): SendToKindleConfigDto | undefined => {
  const senderAddress = getEmailSenderAddress(config)

  if (!senderAddress) return undefined

  return {
    senderAddress,
    maxFileSizeBytes: config.SEND_TO_KINDLE_MAX_FILE_SIZE_BYTES,
    maxSendsPerDay: config.SEND_TO_KINDLE_MAX_SENDS_PER_DAY,
  }
}
