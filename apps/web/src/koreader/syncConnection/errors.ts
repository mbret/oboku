import { ObokuErrorCode } from "@oboku/shared"
import { isApiError } from "../../errors/errors.shared"

const CONNECTION_UNUSABLE_ERROR_CODES: ReadonlySet<string> = new Set([
  ObokuErrorCode.ERROR_KOREADER_SYNC_NOT_CONNECTED,
  ObokuErrorCode.ERROR_KOREADER_SYNC_SERVER_UNAUTHORIZED,
])

/**
 * An API error saying the account has no KOReader sync connection to go
 * through: none, or one whose key the server no longer accepts.
 */
export const isKoreaderSyncConnectionUnusableError = (error: unknown) => {
  const code = isApiError(error)
    ? error.response.data.errors[0]?.code
    : undefined

  return code !== undefined && CONNECTION_UNUSABLE_ERROR_CODES.has(code)
}
