import {
  type ObokuErrorCode,
  type ObokuErrorResponseDto,
  zObokuErrorResponseDto,
} from "@oboku/shared"
import { HttpClientError } from "../http/httpClient.shared"

type HttpApiError = {
  response: {
    data: ObokuErrorResponseDto
  }
}

export class CancelError extends Error {
  /**
   * Brand to keep `CancelError` structurally distinct from `Error`. Without it
   * the two are identical, and the inferred `isCancelError` type predicate
   * (TS 5.5+) narrows `!isCancelError(error)` on an `Error` down to `never`.
   */
  readonly isCancelError = true

  constructor(message?: string) {
    super(message ?? "CancelError")
  }
}

export class UnsupportedMethodError extends Error {
  constructor(message?: string) {
    super(message ?? "UnsupportedMethodError")
  }
}

export class OfflineError extends Error {
  constructor() {
    super("OfflineError")
  }
}

export class StreamerFileNotSupportedError extends Error {}
export class StreamerFileNotFoundError extends Error {}

/**
 * Thrown to escalate an unrecoverable failure to the app-level error boundary,
 * which renders the global recovery screen. Reserve for states the user cannot
 * work around in place (e.g. no valid persisted config and the config endpoint
 * is unreachable), not for failures a cache or retry can absorb.
 */
export class CriticalError extends Error {
  constructor(message?: string, options?: ErrorOptions) {
    super(message ?? "CriticalError", options)
    this.name = "CriticalError"
  }
}

export const isCancelError = (error: unknown) => error instanceof CancelError

export const ERROR_LINK_INVALID_MESSAGE =
  "The book's file is invalid. Check it on the book details screen."

export const ERROR_NO_LINK_MESSAGE =
  "Your book has no file to download. Add one before you continue."

export const isApiError = (error: unknown): error is HttpApiError =>
  error instanceof HttpClientError &&
  zObokuErrorResponseDto.safeParse(error.response?.data).success

/** Whether the API refused the request with `code` as its first error. */
export const hasApiErrorCode = (error: unknown, code: ObokuErrorCode) =>
  isApiError(error) && error.response.data.errors[0]?.code === code
