import middy from "@middy/core"
import middyJsonBodyParser from "@middy/http-json-body-parser"
import httpErrorHandler from "@middy/http-error-handler"
import httpHeaderNormalizer from "@middy/http-header-normalizer"
import cors from "@middy/http-cors"
import { transpileSchema } from "@middy/validator/transpile"
import validator from "@middy/validator"

import { init, wrapHandler } from "@sentry/aws-serverless"
import { ObokuErrorCode } from "@oboku/shared"
// import { nodeProfilingIntegration } from "@sentry/profiling-node"

init({
  dsn: process.env.SENTRY_DSN,
  // integrations: [nodeProfilingIntegration()],
  // Add Tracing by setting tracesSampleRate and adding integration
  // Set tracesSampleRate to 1.0 to capture 100% of transactions
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
  // Set sampling rate for profiling - this is relative to tracesSampleRate
  profilesSampleRate: 1.0
})

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

  const handlerWithSentry = wrapHandler(handler)

  return (
    middy(handlerWithSentry)
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
              headers: "*",
              origin: "*"
            }).onError
          : () => {
              //
            }
      })
      .use(
        /**
         * Non http response will be converted to http response and use
         * the fallback message
         */
        httpErrorHandler({
          fallbackMessage: JSON.stringify({
            errors: [{ code: ObokuErrorCode.UNKNOWN }]
          })
        })
      )
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
