import './loadEnv'
import { APIGatewayEventRequestContext, APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda"
import { UnauthorizedError, BadRequestError, NotFoundError } from "./errors"
// import { configure as configureLogger } from "./Logger"
// import { Logger } from "./utils/logger"
import { ObokuSharedError } from '@oboku/shared/src'

// configureLogger(Logger)

const res = (response: APIGatewayProxyResult) => ({
  ...response,
  headers: {
    ...response.headers,
    'Access-Control-Allow-Methods': 'DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': '*',
  }
})

export const lambda = (cb: (event: APIGatewayProxyEvent, context: APIGatewayEventRequestContext) => Promise<APIGatewayProxyResult>) =>
  async (event: APIGatewayProxyEvent, context: APIGatewayEventRequestContext): Promise<APIGatewayProxyResult> => {
    try {
      if (event.httpMethod.toLowerCase() === 'options') {
        return res({
          statusCode: 204,
          body: JSON.stringify({})
        })
      }

      const response = await cb(event, context)

      return res(response)
    } catch (e) {
      console.error(e)
      console.error(JSON.stringify({ stack: (e as any).stack, code: (e as any)?.code }))
      console.error('response', (e as any)?.response)
      if (e instanceof ObokuSharedError && e.previousError) {
        const prevError = e.previousError as any
        console.error(prevError)
        console.error(JSON.stringify({ stack: prevError.stack, code: prevError?.code }))
        console.error('response', prevError?.response)
      }
      let body: {
        error?: string,
        errors: any[],
        stack?: string,
        code?: string
      } = { errors: [] }

      if (process.env.ENV === 'DEV') {
        body = { ...body, error: (e as any).toString(), stack: (e as any).stack, code: (e as any).code }
      }

      if (e instanceof NotFoundError) {
        body.errors = e.errors
        return res({
          statusCode: 404,
          body: JSON.stringify(body),
        })
      }

      if (e instanceof BadRequestError) {
        body.errors = e.errors
        return res({
          statusCode: 400,
          body: JSON.stringify(body),
        })
      }

      if (e instanceof UnauthorizedError) {
        return res({
          statusCode: 401,
          body: JSON.stringify(body),
        })
      }

      return res({
        statusCode: 500,
        body: JSON.stringify(body),
      })
    }
  }
