import { ValidatedEventAPIGatewayProxyEvent } from "@libs/api-gateway"
import { getAwsLambda } from "@libs/lambda"
import { getNormalizedHeader } from "@libs/utils"
import schema from "./schema"
import { InvokeCommand } from "@aws-sdk/client-lambda"
import { STAGE } from "src/constants"
import { COLLECTION_METADATA_LOCK_MN } from "@oboku/shared"
import { lock } from "@libs/supabase/lock"
import { Logger } from "@libs/logger"
import { withMiddy } from "@libs/middy/withMiddy"

const logger = Logger.child({ module: "handler" })

const lambda: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (
  event,
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
        authorization: getNormalizedHeader(event, `authorization`),
      },
    }),
  })

  logger.info(`invoke for ${event.body.collectionId}`)

  try {
    const lockId = `metadata-collection_${event.body.collectionId}`

    const { alreadyLocked } = await lock(lockId, COLLECTION_METADATA_LOCK_MN)

    if (!alreadyLocked) {
      const response = await client.send(command)

      logger.info(
        `${event.body.collectionId}: command sent with success ${response.$metadata.requestId}`,
      )
      logger.info(response)
    } else {
      logger.info(`${event.body.collectionId} is already locked, ignoring!`)
    }
  } catch (error) {
    logger.error(error)

    throw error
  }

  return {
    statusCode: 202,
    body: JSON.stringify({}),
  }
}

export const main = withMiddy(lambda)
