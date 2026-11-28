import type { AppConfigService } from "../config/AppConfigService.js"
import { getEmailSenderAddress } from "../email/EmailService.js"
import { KINDLE_MAX_SENDS_PER_USER_PER_DAY } from "./kindle-daily-sends.service.js"
import type { SendToKindleConfigDto } from "./kindle.dto.js"

/**
 * What the instance applies to Send to Kindle, none while it cannot send
 * emails: the feature is then off.
 */
export const toSendToKindleConfig = (
  config: Pick<
    AppConfigService,
    "EMAIL_SMTP_HOST" | "EMAIL_FROM" | "SEND_TO_KINDLE_MAX_FILE_SIZE_BYTES"
  >,
): SendToKindleConfigDto | undefined => {
  const senderAddress = getEmailSenderAddress(config)

  if (!senderAddress) return undefined

  return {
    senderAddress,
    maxFileSizeBytes: config.SEND_TO_KINDLE_MAX_FILE_SIZE_BYTES,
    maxSendsPerDay: KINDLE_MAX_SENDS_PER_USER_PER_DAY,
  }
}
