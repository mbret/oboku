import { ValidatedEventAPIGatewayProxyEvent } from "@libs/api-gateway"
import { getAwsLambda, withMiddy } from "@libs/lambda"
import { getNormalizedHeader } from "@libs/utils"
import { STAGE } from "../../constants"
import schema from "./schema"
import { InvokeCommand } from "@aws-sdk/client-lambda"
import { lock } from "@libs/supabase/lock"

const LOCK_MAX_DURATION_MN = 10

const lambda: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (
  event
) => {
  const client = getAwsLambda()

  const command = new InvokeCommand({
    InvocationType: "Event",
    FunctionName: `oboku-api-${STAGE}-syncDataSourceLongProcess`,
    Payload: JSON.stringify({
      body: {
        dataSourceId: event.body.dataSourceId,
        credentials: getNormalizedHeader(event, `oboku-credentials`),
        authorization: getNormalizedHeader(event, `authorization`)
      }
    })
  })

  const lockId = `sync_${event.body.dataSourceId}`

  const { alreadyLocked } = await lock(lockId, LOCK_MAX_DURATION_MN)

  if (!alreadyLocked) {
    await client.send(command)
  }

  return {
    statusCode: 202,
    body: JSON.stringify({})
  }
}

export const main = withMiddy(lambda)
