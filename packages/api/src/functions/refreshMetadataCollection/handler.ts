import { ValidatedEventAPIGatewayProxyEvent } from "@libs/api-gateway"
import { getAwsLambda, withMiddy } from "@libs/lambda"
import { getNormalizedHeader } from "@libs/utils"
import schema from "./schema"
import { InvokeCommand } from "@aws-sdk/client-lambda"
import { STAGE } from "src/constants"
import { COLLECTION_METADATA_LOCK_MN } from "@oboku/shared"
import { lock } from "@libs/supabase/lock"

const lambda: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (
  event
) => {
  const client = getAwsLambda()

  const command = new InvokeCommand({
    InvocationType: "Event",
    FunctionName: `oboku-api-${STAGE}-refreshMetadataCollectionLongProcess`,
    Payload: JSON.stringify({
      body: {
        collectionId: event.body.collectionId,
        soft: event.body.soft,
        credentials: getNormalizedHeader(event, `oboku-credentials`),
        authorization: getNormalizedHeader(event, `authorization`)
      }
    })
  })

  const lockId = `metadata-collection_${event.body.collectionId}`

  const { alreadyLocked } = await lock(lockId, COLLECTION_METADATA_LOCK_MN)

  if (!alreadyLocked) {
    await client.send(command)
  }

  return {
    statusCode: 202,
    body: JSON.stringify({})
  }
}

export const main = withMiddy(lambda)
