export const readResponseErrorMessage = async (
  response: Response,
  fallbackMessage: string,
) => {
  const contentType = response.headers.get("content-type") ?? ""

  if (contentType.includes("application/json")) {
    try {
      const data: unknown = await response.json()

      if (
        typeof data === "object" &&
        data !== null &&
        "message" in data &&
        typeof data.message === "string"
      ) {
        return data.message
      }
    } catch {
      return fallbackMessage
    }
  }

  const text = await response.text()

  return text || fallbackMessage
}
