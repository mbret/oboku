import { ObokuErrorCode } from "@oboku/shared"
import { HttpClientError } from "../../http/httpClient"

type HttpApiError = {
  response: {
    data: { errors: { code?: string }[] }
  }
}

export const createServerError = async (response: Response) => {
  try {
    const body = await response.json()
    const errors =
      body?.errors?.map((error) => ({
        code: error?.code
      })) || []
    throw new ServerError(response, errors)
  } catch (e) {
    throw e
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

export const isCancelError = (error: unknown) => error instanceof CancelError

export const isApiError = (error: unknown): error is HttpApiError => {
  return (
    error instanceof HttpClientError &&
    !!error.response &&
    typeof error.response?.data === "object" &&
    error.response.data !== null &&
    "errors" in error.response?.data &&
    Array.isArray(error.response?.data.errors)
  )
}

export const ErrorMessage = ({ error }: { error: unknown }) => {
  return (
    <>
      {(isApiError(error) &&
      error.response?.data.errors[0]?.code ===
        ObokuErrorCode.ERROR_SIGNIN_NO_EMAIL
        ? "Please make your email address accessible with this provider"
        : isApiError(error) &&
            error.response?.data.errors[0]?.code ===
              ObokuErrorCode.ERROR_SIGNIN_EMAIL_NO_VERIFIED
          ? "Please verify your email with this provider before continuing"
          : undefined) ?? "Something went wrong. Could you try again?"}
    </>
  )
}
export class ServerError extends Error {
  constructor(
    public response: Response,
    public errors: { code?: ObokuErrorCode }[]
  ) {
    super("Error with server")
    this.response = response
    this.name = "ServerError"
    this.errors = errors
  }
}
