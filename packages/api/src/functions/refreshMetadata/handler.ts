import { ValidatedEventAPIGatewayProxyEvent } from "@libs/api-gateway"
import { getAwsLambda, withMiddy } from "@libs/lambda"
import { getNormalizedHeader } from "@libs/utils"
import schema from "./schema"
import { InvokeCommand } from "@aws-sdk/client-lambda"
import { STAGE } from "src/constants"
import { lock } from "@libs/supabase/lock"
import { Logger } from "@libs/logger"

const LOCK_MAX_DURATION_MN = 5

const logger = Logger.child({ module: "handler" })

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

  logger.info(`invoke for ${event.body.bookId}`)

  try {
    const lockId = `metadata_${event.body.bookId}`

    const { alreadyLocked } = await lock(lockId, LOCK_MAX_DURATION_MN)

    if (!alreadyLocked) {
      const response = await client.send(command)

      logger.info(`${event.body.bookId}: command sent with success`)
      logger.info(response)
    } else {
      logger.info(`${event.body.bookId} is already locked, ignoring!`)
    }
  } catch (error) {
    logger.error(error)

    throw error
  }

  return {
    statusCode: 202,
    body: JSON.stringify({})
  }
}

export const main = withMiddy(lambda)
