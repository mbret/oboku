import type { APIGatewayProxyEvent, APIGatewayProxyResult, Handler } from "aws-lambda"
import type { FromSchema } from "json-schema-to-ts";

type ValidatedAPIGatewayProxyEvent<S> = Omit<APIGatewayProxyEvent, 'body'> & { body: FromSchema<S> }
export type ValidatedEventAPIGatewayProxyEvent<S = Record<string, unknown>> = Handler<ValidatedAPIGatewayProxyEvent<S>, APIGatewayProxyResult>

export const getEventBody = (event: APIGatewayProxyEvent) => {
  if (!event.body) {
    return {}
  }
  
  const body = event.isBase64Encoded ? (Buffer.from(event.body, 'base64')).toString() : event.body

  return body ? JSON.parse(body) : {}
}