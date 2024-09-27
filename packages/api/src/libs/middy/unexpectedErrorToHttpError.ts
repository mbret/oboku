import { createHttpError } from "@libs/httpErrors"
import { MiddlewareObj } from "@middy/core"
import { ObokuErrorCode } from "@oboku/shared"

export const unexpectedErrorToHttpError = (): MiddlewareObj => ({
  onError: async (request) => {
    if (request.error) {
      console.error("error received", request.error)

      request.error = createHttpError(500, {
        code: ObokuErrorCode.UNKNOWN,
        message: process.env.NODE_ENV === "development" ? request.error.message : ``
      })
    }
  }
})
