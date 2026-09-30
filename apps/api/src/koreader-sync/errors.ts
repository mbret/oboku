import { HttpException, HttpStatus } from "@nestjs/common"

/**
 * The errors koreader-sync-server answers with (its `config/errors.lua`).
 * KOReader's client only accepts the statuses listed for each call, so these
 * keep the reference server's statuses and bodies.
 */
const KOREADER_SYNC_ERRORS = {
  unauthorized: {
    status: HttpStatus.UNAUTHORIZED,
    code: 2001,
    message: "Unauthorized",
  },
  invalidRequest: {
    status: HttpStatus.FORBIDDEN,
    code: 2003,
    message: "Invalid request",
  },
  documentMissing: {
    status: HttpStatus.FORBIDDEN,
    code: 2004,
    message: "Field 'document' not provided.",
  },
  registrationDisabled: {
    status: HttpStatus.PAYMENT_REQUIRED,
    code: 2005,
    message:
      "User registration is disabled. Generate your password in oboku, under Profile > KOReader sync.",
  },
  documentNotServable: {
    status: HttpStatus.FORBIDDEN,
    code: 2007,
    message:
      "Field 'document' contains characters the read route cannot serve.",
  },
} as const

export const createKoreaderSyncError = (
  error: keyof typeof KOREADER_SYNC_ERRORS,
) => {
  const { status, code, message } = KOREADER_SYNC_ERRORS[error]

  return new HttpException({ code, message }, status)
}
