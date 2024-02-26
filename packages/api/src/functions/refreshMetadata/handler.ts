import { ValidatedEventAPIGatewayProxyEvent } from "@libs/api-gateway"
import { getAwsLambda, withMiddy } from "@libs/lambda"
import { getNormalizedHeader } from "@libs/utils"
import { STAGE } from "../../constants"
import schema from "./schema"
import { InvokeCommand } from "@aws-sdk/client-lambda"

const lambda: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (
  event
) => {
  const client = getAwsLambda()

  const command = new InvokeCommand({
    InvocationType: "Event",
    FunctionName: `oboku-api-${STAGE}-refreshMetadataLongProcess`,
    Payload: JSON.stringify({
      body: {
        bookId: event.body.bookId,
        credentials: getNormalizedHeader(event, `oboku-credentials`),
        authorization: getNormalizedHeader(event, `authorization`)
      }
    })
  })

  await client.send(command)

  return {
    statusCode: 202,
    body: JSON.stringify({})
  }
}

export const main = withMiddy(lambda)
