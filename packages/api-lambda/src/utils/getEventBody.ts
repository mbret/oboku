import { APIGatewayProxyEvent } from "aws-lambda";

export const getEventBody = (event: APIGatewayProxyEvent) => {
  if (!event.body) {
    return {}
  }
  
  const body = event.isBase64Encoded ? (Buffer.from(event.body, 'base64')).toString() : event.body

  return body ? JSON.parse(body) : {}
}