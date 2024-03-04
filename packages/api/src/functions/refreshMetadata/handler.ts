import { ValidatedEventAPIGatewayProxyEvent } from "@libs/api-gateway"
import { getAwsLambda, withMiddy } from "@libs/lambda"
import { getNormalizedHeader } from "@libs/utils"
import schema from "./schema"
import { InvokeCommand } from "@aws-sdk/client-lambda"
import { STAGE } from "src/constants"
import { Logger } from "@libs/logger"
import { supabase } from "@libs/supabase/client"

const LOCK_MAX_DURATION_MN = 10

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

  const lockId = `metadata_${event.body.bookId}`

  const response = await supabase
    .from("lock")
    .insert({ id: 1, lock_id: lockId })
    .select()

  if (response.status === 409) {
    const response = await supabase.from("lock").select().eq("lock_id", lockId)

    const lock = (response.data ?? [])[0]
    const created_at = new Date(lock.created_at)
    const now = new Date()
    const differenceInMilliseconds = now.getTime() - created_at.getTime()
    const differenceInMinutes = Math.floor(
      differenceInMilliseconds / (1000 * 60)
    )

    Logger.log(
      `${lockId} has already a lock created at ${lock.created_at} and is ${differenceInMinutes}mn old`
    )

    if (differenceInMinutes > LOCK_MAX_DURATION_MN) {
      Logger.log(`${lockId} lock is assumed lost and will be recreated`)

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
