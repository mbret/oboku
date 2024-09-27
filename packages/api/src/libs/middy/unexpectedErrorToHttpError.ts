import { createHttpError } from "@libs/httpErrors"
import { MiddlewareObj } from "@middy/core"
import { ObokuErrorCode } from "@oboku/shared"

export const unexpectedErrorToHttpError = (): MiddlewareObj => ({
  onError: async (request) => {
    if (request.error) {
      console.error("error received", request.error)
    }

    if (request.error) {
      request.error = createHttpError(500, {
        code: ObokuErrorCode.UNKNOWN,
        message: request.error.message
      })

      // eslint-disable-next-line no-extra-semi
      ;(request.error as any).expose =
        (request.error as any)?.expose ?? process.env.NODE_ENV === "development"
    }
  }
})
