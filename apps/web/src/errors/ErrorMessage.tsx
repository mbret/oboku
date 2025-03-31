import { ObokuErrorCode } from "@oboku/shared"
import { isApiError } from "./errors.shared"
import { HttpClientError } from "../http/httpClient.shared"

export const ErrorMessage = ({ error }: { error: unknown }) => {
  if (error instanceof HttpClientError && error.response?.status === 401) {
    return "Invalid credentials"
  }

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
