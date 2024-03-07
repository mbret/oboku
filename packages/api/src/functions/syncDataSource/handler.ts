import { ValidatedEventAPIGatewayProxyEvent } from "@libs/api-gateway"
import { getAwsLambda, withMiddy } from "@libs/lambda"
import { getNormalizedHeader } from "@libs/utils"
import { STAGE } from "../../constants"
import schema from "./schema"
import { InvokeCommand } from "@aws-sdk/client-lambda"
import { Logger } from "@libs/logger"
import { supabase } from "@libs/supabase/client"
import { isLockOutdated } from "@libs/supabase/isLockOutdated"

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

  const lockId = `sync_${event.body.bookId}`

  const response = await supabase
    .from("lock")
    .insert({ lock_id: lockId })
    .select()

  if (response.status === 409) {
    const response = await supabase.from("lock").select().eq("lock_id", lockId)

    if (!response.count) {
      Logger.log(
        `${lockId} not found after receiving 409. Invalid state, ignoring invocation`
      )

      return {
        statusCode: 202,
        body: JSON.stringify({})
      }
    }

    const lock = (response.data ?? [])[0]
    const now = new Date()

    if (isLockOutdated(lock, LOCK_MAX_DURATION_MN)) {
      Logger.log(`${lockId} lock is outdated and will be recreated`)

      const updatedResponse = await supabase
        .from("lock")
        .upsert({ id: lock.id, created_at: now, lock_id: lockId })
        .select()

      if (updatedResponse.status === 200) {
        Logger.log(`${lockId} lock correctly updated, command will be sent`)

        await client.send(command)
      }
    } else {
      Logger.log(`${lockId} invocation is ignored`)
    }
  }

  if (response.status === 201) {
    Logger.log(
      `New lock created for ${lockId} with id ${(response.data ?? [])[0].id}. Command will be sent`
    )

    await client.send(command)
  }

  return {
    statusCode: 202,
    body: JSON.stringify({})
  }
}

export const main = withMiddy(lambda)
