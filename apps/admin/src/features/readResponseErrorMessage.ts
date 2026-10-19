import { zHttpErrorResponseDto } from "@oboku/shared"

const parseJson = (text: string): unknown => {
  try {
    return JSON.parse(text)
  } catch {
    return undefined
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

  const apiError = zHttpErrorResponseDto.safeParse(parseJson(text))

  if (!apiError.success) {
    return text
  }

  const { message } = apiError.data

  return Array.isArray(message) ? message.join(", ") : message
}
