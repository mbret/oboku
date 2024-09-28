import middy from "@middy/core"
import middyJsonBodyParser from "@middy/http-json-body-parser"
import httpErrorHandler from "@middy/http-error-handler"
import httpHeaderNormalizer from "@middy/http-header-normalizer"
import cors from "@middy/http-cors"
import { transpileSchema } from "@middy/validator/transpile"
import validator from "@middy/validator"
import { unexpectedErrorToHttpError } from "./unexpectedErrorToHttpError"

import * as Sentry from "@sentry/aws-serverless"
// import { nodeProfilingIntegration } from "@sentry/profiling-node"

Sentry.init({
  dsn: "https://0d7a61df8dba4122be660fcc1161bf49@o490447.ingest.us.sentry.io/5554285",
  // integrations: [nodeProfilingIntegration()],
  // Add Tracing by setting tracesSampleRate and adding integration
  // Set tracesSampleRate to 1.0 to capture 100% of transactions
  // We recommend adjusting this value in production
  tracesSampleRate: 1.0,
  // Set sampling rate for profiling - this is relative to tracesSampleRate
  profilesSampleRate: 1.0,
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

  const handlerWithSentry = Sentry.wrapHandler(handler)

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
      .use(unexpectedErrorToHttpError())
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
