import middy from "@middy/core"
import { jsonSafeParse } from "@middy/util"
import middyJsonBodyParser from "@middy/http-json-body-parser"
import httpErrorHandler from "@middy/http-error-handler"
import httpHeaderNormalizer from "@middy/http-header-normalizer"
import cors from "@middy/http-cors"
import { Lambda } from "aws-sdk"
import { OFFLINE } from "../constants"

export const middyfy = (handler: any) => {
  return (
    middy(handler)
      .use(httpHeaderNormalizer())
      .use(middyJsonBodyParser())
      .use({
        onError: async (request) => {
          if (request.error) {
            console.error(request.error)
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
        cors({
          headers: `*`
        })
      )
      .use(
        httpErrorHandler({
          // handle non http error with 500 and generic message
          fallbackMessage: `An error occurred`
        })
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
