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

  const response = await supabase
    .from("metadata_lock")
    .insert({ id: 1, book_id: event.body.bookId })
    .select()

  if (response.status === 409) {
    const response = await supabase
      .from("metadata_lock")
      .select()
      .eq("book_id", event.body.bookId)

    const lock = (response.data ?? [])[0]
    const created_at = new Date(lock.created_at)
    const now = new Date()
    const differenceInMilliseconds = now.getTime() - created_at.getTime()
    const differenceInMinutes = Math.floor(
      differenceInMilliseconds / (1000 * 60)
    )

    Logger.log(
      `${event.body.bookId} has already a lock created at ${lock.created_at} and is ${differenceInMinutes}mn old`
    )

    if (differenceInMinutes > LOCK_MAX_DURATION_MN) {
      Logger.log(
        `${event.body.bookId} lock is assumed lost and will be recreated`
      )

      const updatedResponse = await supabase
        .from("metadata_lock")
        .upsert({ id: lock.id, created_at: now, book_id: event.body.bookId })
        .select()

      if (updatedResponse.status === 200) {
        Logger.log(
          `${event.body.bookId} lock correctly updated, command will be sent`
        )

        await client.send(command)
      }
    } else {
      Logger.log(`${event.body.bookId} invocation is ignored`)
    }
  }

  if (response.status === 201) {
    Logger.log(
      `New lock created for ${event.body.bookId} with id ${(response.data ?? [])[0].id}. Command will be sent`
    )

    await client.send(command)
  }

  return {
    statusCode: 202,
    body: JSON.stringify({})
  }
}

export const main = withMiddy(lambda)
