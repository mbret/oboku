import { ObokuErrorCode } from "@oboku/shared"

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
