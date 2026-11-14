import { ObokuErrorCode } from "@oboku/shared"
import { hasApiErrorCode } from "../../../errors/errors.shared"
import { HttpClientError } from "../../../http/httpClient.shared"

/** The API answers a push or a pull with a 404 when the account has no connection. */
export const isKoreaderSyncConnectionMissingError = (error: unknown) =>
  error instanceof HttpClientError && error.response?.status === 404

export const isKoreaderSyncKeyRefusedError = (error: unknown) =>
  hasApiErrorCode(error, ObokuErrorCode.ERROR_KOREADER_SYNC_SERVER_UNAUTHORIZED)
