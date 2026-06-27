import { HttpClientError } from "../http/httpClient.shared"

type HttpApiError = {
  response: {
    data: { errors: { code?: string }[] }
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

export const isCancelError = (error: unknown) => error instanceof CancelError

export const ERROR_LINK_INVALID_MESSAGE =
  "Book link is invalid, verify it on book detail screen."

export const ERROR_NO_LINK_MESSAGE =
  "Your book does not have a valid link to download the file. Please add one before proceeding."

export const isApiError = (error: unknown): error is HttpApiError => {
  return (
    error instanceof HttpClientError &&
    !!error.response &&
    typeof error.response.data === "object" &&
    error.response.data !== null &&
    "errors" in error.response.data &&
    Array.isArray(error.response.data.errors)
  )
}
