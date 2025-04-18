import { ObokuErrorCode } from "@oboku/shared"
import { isApiError } from "./errors.shared"
import { HttpClientError } from "../http/httpClient.shared"

export const ErrorMessage = ({ error }: { error: unknown }) => {
  return <>{errorToMessage(error)}</>
}

export const errorToMessage = (error: unknown) => {
  if (error instanceof HttpClientError && error.response?.status === 401) {
    return "Invalid credentials"
  }

  if (
    isApiError(error) &&
    error.response?.data.errors[0]?.code ===
      ObokuErrorCode.ERROR_SIGNIN_NO_EMAIL
  ) {
    return "Please make your email address accessible with this provider"
  }

  if (
    isApiError(error) &&
    error.response?.data.errors[0]?.code ===
      ObokuErrorCode.ERROR_SIGNIN_EMAIL_NO_VERIFIED
  ) {
    return "Please verify your email with this provider before continuing"
  }

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message
  }

  return "Something went wrong"
}
