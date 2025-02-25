import { HttpClientError } from "../http/HttpClientError.shared"

type HttpApiError = {
  response: {
    data: { errors: { code?: string }[] }
  }
}

export class CancelError extends Error {
  constructor() {
    super("CancelError")
  }
}

export class OfflineError extends Error {
  constructor() {
    super("OfflineError")
  }
}

export class StreamerFileNotSupportedError extends Error {}
export class StreamerFileNotFoundError extends Error {}

type Code = "unknown" | "cancelled"

export class ObokuPluginError extends Error {
  code: Code
  obokuError = true
  severity: "internal" | "user" = "internal"

  constructor({
    code,
    message,
    severity = "internal",
  }: {
    code: Code
    message?: string
    severity?: "internal" | "user"
  }) {
    super(`Plugin error with code: ${code}`)

    this.code = code
    this.severity = severity

    if (message) {
      this.message = message
    }

    // 👇️ because we are extending a built-in class
    Object.setPrototypeOf(this, ObokuPluginError.prototype)
  }
}

export const isCancelError = (error: unknown) => error instanceof CancelError

export const isApiError = (error: unknown): error is HttpApiError => {
  return (
    error instanceof HttpClientError &&
    !!error.response &&
    typeof error.response?.data === "object" &&
    error.response.data !== null &&
    "errors" in error.response.data &&
    Array.isArray(error.response?.data.errors)
  )
}

export const isPluginError = (error: unknown): error is ObokuPluginError =>
  error instanceof ObokuPluginError ||
  (!!error && typeof error === "object" && "obokuError" in error)
