import { ObokuErrorCode, ObokuSharedError } from "@oboku/shared"
import {
  ERROR_LINK_INVALID_MESSAGE,
  ERROR_NO_LINK_MESSAGE,
  isApiError,
} from "./errors.shared"
import { HttpClientError } from "../http/httpClient.shared"
import { Alert } from "@mui/material"

export const ErrorMessage = ({ error }: { error: unknown }) => {
  return <>{errorToMessage(error)}</>
}

export const ErrorAlert = ({ error }: { error: unknown }) => {
  const severity = error instanceof ObokuSharedError ? error.severity : "error"

  return (
    <Alert severity={severity === "user" ? "warning" : "error"}>
      {errorToMessage(error)}
    </Alert>
  )
}

const ERROR_RESOURCE_NOT_REACHABLE_MESSAGE =
  "Resource is not reachable. Make sure it is accessible and allows external access (CORS)."

const fromObokuErrorCode = (error: ObokuErrorCode) => {
  switch (error) {
    case ObokuErrorCode.ERROR_RESOURCE_NOT_FOUND:
      return "The resource does not seem to exist. Please, verify the link and try again."
    case ObokuErrorCode.ERROR_LINK_INVALID:
      return ERROR_LINK_INVALID_MESSAGE
    case ObokuErrorCode.ERROR_NO_LINK:
      return ERROR_NO_LINK_MESSAGE
    case ObokuErrorCode.ERROR_RESOURCE_NOT_REACHABLE:
      return ERROR_RESOURCE_NOT_REACHABLE_MESSAGE
    case ObokuErrorCode.ERROR_SIGNUP_LINK_INVALID:
      return "This sign up link is invalid or expired. Please request a new one."
    case ObokuErrorCode.ERROR_SIGNUP_LINK_MISSING_TOKEN:
      return "This sign up link is missing a token. Please request a new one."
    case ObokuErrorCode.ERROR_ACCOUNT_ALREADY_EXISTS:
      return "An account already exists for this email. Please sign in instead."
    case ObokuErrorCode.ERROR_MAGIC_LINK_INVALID:
      return "This magic link is invalid, expired, or no longer applicable to this account."
    case ObokuErrorCode.ERROR_MAGIC_LINK_MISSING_TOKEN:
      return "This magic link is missing a token. Please request a new one."
    case ObokuErrorCode.ERROR_DATASOURCE_DOWNLOAD_DIFFERENT_DEVICE:
      return "You cannot download this book since it has been added on a different device. Please use your other device to read or synchronize your book using a cloud provider."
    case ObokuErrorCode.ERROR_CONNECTOR_NOT_CONFIGURED:
      return "No connector is configured for this link. Please set one up first."
    default:
      return `Something went wrong. Error code: ${error}`
  }
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
    return "Your local account needs email verification before password sign-in. Use the magic link below to verify this account once."
  }

  if (
    typeof error === "string" &&
    Object.values(ObokuErrorCode).includes(error as ObokuErrorCode)
  ) {
    return fromObokuErrorCode(error as ObokuErrorCode)
  }

  if (error instanceof ObokuSharedError) {
    return fromObokuErrorCode(error.code)
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
