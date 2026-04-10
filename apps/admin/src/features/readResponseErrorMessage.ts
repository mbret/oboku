export const readResponseErrorMessage = async (
  response: Response,
  fallbackMessage: string,
) => {
  const contentType = response.headers.get("content-type") ?? ""
  const text = await response.text()

  if (!text) {
    return fallbackMessage
  }

  if (contentType.includes("application/json")) {
    try {
      const data: unknown = JSON.parse(text)

      if (
        typeof data === "object" &&
        data !== null &&
        "message" in data &&
        typeof data.message === "string"
      ) {
        return data.message
      }

      if (
        typeof data === "object" &&
        data !== null &&
        "message" in data &&
        Array.isArray(data.message)
      ) {
        const messages = data.message.filter(
          (message): message is string => typeof message === "string",
        )

        if (messages.length > 0) {
          return messages.join(", ")
        }
      }
    } catch {
      return text || fallbackMessage
    }
  }

  return text || fallbackMessage
}
