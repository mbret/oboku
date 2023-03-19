import middy from "@middy/core"
import { jsonSafeParse } from "@middy/util"
import middyJsonBodyParser from "@middy/http-json-body-parser"
import httpErrorHandler from "@middy/http-error-handler"
import httpHeaderNormalizer from "@middy/http-header-normalizer"
import cors from "@middy/http-cors"
import { Lambda } from "aws-sdk"
import { OFFLINE } from "../constants"
import { transpileSchema } from "@middy/validator/transpile"
import validator from "@middy/validator"

export const withMiddy = (
  handler: any,
  {
    withCors = true,
    schema = {}
  }: {
    /**
     * cors middleware only support REST / HTTP format. Some lambda are invoked from
     * others lambda and therefore does not comply to the right format. These lambda
     * can skip cors
     */
    withCors?: boolean
    schema?: Parameters<typeof transpileSchema>[0]
  } = {}
) => {
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
      .use(middyJsonBodyParser())
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
          // handle non http error with 500 and generic message
          fallbackMessage: `An error occurred`
        })
      )
      .use({
        onError: async (request) => {
          if (request.error) {
            console.error("error received", request.error)
          }
          // we enforce non exposure unless specified
          if (request.error && (request.error as any)?.expose === undefined) {
            // eslint-disable-next-line @typescript-eslint/no-extra-semi
            ;(request.error as any).expose = false
          }

          // we force JSON response for any error that is a simple string
          if (
            request.error &&
            typeof jsonSafeParse(request.error.message) === `string`
          ) {
            request.error.message = JSON.stringify({
              message: request.error.message
            })
          }
        }
      })
      // @todo eventually protect the api and only allow a subset of origins
      .use(
        withCors
          ? cors({
              headers: `*`
            })
          : {
              before: () => {
                //
              }
            }
      )
  )
}

export const getAwsLambda = () =>
  new Lambda({
    region: "us-east-1",
    httpOptions: {},
    ...(OFFLINE && {
      endpoint: `http://localhost:3002`
    })
  })
