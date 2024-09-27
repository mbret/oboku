import middy from "@middy/core"
import { jsonSafeParse } from "@middy/util"
import middyJsonBodyParser from "@middy/http-json-body-parser"
import httpErrorHandler from "@middy/http-error-handler"
import httpHeaderNormalizer from "@middy/http-header-normalizer"
import cors from "@middy/http-cors"
import { transpileSchema } from "@middy/validator/transpile"
import validator from "@middy/validator"
import { createHttpError } from "@libs/httpErrors"
import { ObokuErrorCode } from "@oboku/shared"

export const withMiddy = (
  handler: any,
  {
    withCors = true,
    withJsonBodyParser = true,
    schema = {}
  }: {
    /**
     * cors middleware only support REST / HTTP format. Some lambda are invoked from
     * others lambda and therefore does not comply to the right format. These lambda
     * can skip cors
     */
    withCors?: boolean
    withJsonBodyParser?: boolean
    schema?: Parameters<typeof transpileSchema>[0]
  } = {}
) => {
  const noop = {
    before: () => {}
  }

  return (
    middy(handler)
      /**
       * Some lambda are invoked from others lambda and therefore does not comply to the right format. These lambda.
       * We make sure to have headers so the middy json does not fail
       */
      .use({
        before: (request) => {
          if (!request.event.headers) {
            request.event.headers = {}
          }
        }
      })
      .use(httpHeaderNormalizer())
      .use(withJsonBodyParser ? middyJsonBodyParser({}) : noop)
      .use(
        validator({
          eventSchema: transpileSchema(schema)
        })
      )
      /**
       * middy onError order changed and cors needs to be before to be executed after.
       * Only for onError which is why it's duplicated below as well...
       */
      .use({
        onError: withCors
          ? cors({
              headers: `*`
            }).onError
          : () => {
              //
            }
      })
      .use(
        httpErrorHandler({
          fallbackMessage: `An error occurred`
        })
      )
      .use({
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
              (request.error as any)?.expose ??
              process.env.NODE_ENV === "development"
          }
        }
      })
      // @todo eventually protect the api and only allow a subset of origins
      .use(
        withCors
          ? cors({
              headers: `*`
            })
          : noop
      )
  )
}
