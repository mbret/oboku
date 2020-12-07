import { BAD_USER_INPUT } from "oboku-shared";
import { ERROR_EMAIL_TAKEN } from "oboku-shared";

type ErrorCode = typeof ERROR_EMAIL_TAKEN | typeof BAD_USER_INPUT

export const createServerError = async (response: Response) => {
  try {
    const body = await response.json()
    const errors = body?.errors?.map(error => ({
      code: error?.code
    }))
    throw new ServerError(response, errors);
  } catch (e) {
    throw e
  }
}

export class ServerError extends Error {
  constructor(public response: Response, public errors: { code?: ErrorCode }[]) {
    super('Error with server')
    this.response = response
    this.name = 'ServerError'
    this.errors = errors
  }
}