import {
  ObokuErrorCode,
  type ObokuErrorDto,
  zHttpErrorResponseDto,
  zObokuErrorResponseDto,
} from "@oboku/shared"

const parseJson = (text: string): unknown => {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

const toObokuErrorMessage = (code: ObokuErrorDto["code"]) => {
  switch (code) {
    case ObokuErrorCode.ERROR_ACCOUNT_ALREADY_EXISTS:
      return "An account already exists for this email."
    default:
      return `Request failed with error code ${code}`
  }
}

export const readResponseErrorMessage = async (
  response: Response,
  fallbackMessage: string,
) => {
  const text = await response.text()

  if (!text) {
    return fallbackMessage
  }

  const body = parseJson(text)
  const apiError = zHttpErrorResponseDto.safeParse(body)

  if (apiError.success) {
    const { message } = apiError.data

    return Array.isArray(message) ? message.join(", ") : message
  }

  const code = zObokuErrorResponseDto.safeParse(body).data?.errors[0]?.code

  return code ? toObokuErrorMessage(code) : text
}
