import { ObokuErrorCode } from "@oboku/shared"
import createError from "http-errors"

type ErrorEntry = { code: ObokuErrorCode; message?: string }
type ErrorEntries = ErrorEntry[]

export const createHttpError = (
  code: number,
  error: ErrorEntry | ErrorEntries = { code: ObokuErrorCode.UNKNOWN },
  opts: { expose?: boolean } = { expose: true }
) => {
  if (Array.isArray(error)) {
    return createError(code, JSON.stringify({ errors: error }), opts)
  }
  return createError(code, JSON.stringify({ errors: [error] }), opts)
}
