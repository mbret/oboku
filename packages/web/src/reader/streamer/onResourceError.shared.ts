import { StreamerFileNotFoundError, StreamerFileNotSupportedError } from "../../errors/errors.shared"

export const onResourceError = (error: unknown) => {
  if (error instanceof StreamerFileNotSupportedError) {
    return new Response(error.message, { status: 415 })
  }
  if (error instanceof StreamerFileNotFoundError) {
    return new Response(error.message, { status: 404 })
  }

  console.error(error)

  return new Response(String(error), { status: 500 })
}
