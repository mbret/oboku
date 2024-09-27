import { ValidatedEventAPIGatewayProxyEvent } from "@libs/api-gateway"
import { getAwsLambda } from "@libs/lambda"
import { getNormalizedHeader } from "@libs/utils"
import { STAGE } from "../../constants"
import schema from "./schema"
import { InvokeCommand } from "@aws-sdk/client-lambda"
import { lock } from "@libs/supabase/lock"
import { Logger } from "@libs/logger"
import { withMiddy } from "@libs/middy/withMiddy"

const LOCK_MAX_DURATION_MN = 10

const logger = Logger.child({ module: "handler" })

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

  logger.info(`invoke for ${event.body.dataSourceId}`)

  try {
    const lockId = `sync_${event.body.dataSourceId}`

    const { alreadyLocked } = await lock(lockId, LOCK_MAX_DURATION_MN)

    if (!alreadyLocked) {
      const response = await client.send(command)

      logger.info(
        `${event.body.dataSourceId}: command sent with success ${response.$metadata.requestId}`
      )
      logger.info(response)
    } else {
      logger.info(`${event.body.dataSourceId} is already locked, ignoring!`)
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
