import { ObokuErrorCode } from "@oboku/shared"
import { isApiError } from "../../errors/errors.shared"
import { HttpClientError } from "../../http/httpClient.shared"

/** The API answers a push or a pull with a 404 when the account has no connection. */
const isConnectionMissingError = (error: unknown) =>
  error instanceof HttpClientError && error.response?.status === 404

const isConnectionKeyRefusedError = (error: unknown) =>
  isApiError(error) &&
  error.response.data.errors[0]?.code ===
    ObokuErrorCode.ERROR_KOREADER_SYNC_SERVER_UNAUTHORIZED

/**
 * An API error saying the account has no KOReader sync connection to go
 * through: none, or one whose key the server no longer accepts.
 */
export const isKoreaderSyncConnectionUnusableError = (error: unknown) =>
  isConnectionMissingError(error) || isConnectionKeyRefusedError(error)
