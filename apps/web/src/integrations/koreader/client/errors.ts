import { ObokuErrorCode } from "@oboku/shared"
import { isApiError } from "../../../errors/errors.shared"
import { HttpClientError } from "../../../http/httpClient.shared"

/** The API answers a push or a pull with a 404 when the account has no connection. */
export const isKoreaderSyncConnectionMissingError = (error: unknown) =>
  error instanceof HttpClientError && error.response?.status === 404

export const isKoreaderSyncKeyRefusedError = (error: unknown) =>
  isApiError(error) &&
  error.response.data.errors[0]?.code ===
    ObokuErrorCode.ERROR_KOREADER_SYNC_SERVER_UNAUTHORIZED
