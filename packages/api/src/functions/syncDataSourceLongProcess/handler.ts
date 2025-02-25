import { ValidatedEventAPIGatewayProxyEvent } from "@libs/api-gateway"
import { configure as configureGoogleDataSource } from "@libs/plugins/google"
import { getAuthTokenAsync } from "@libs/auth"
import schema from "./schema"
import { createHttpError } from "@libs/httpErrors"
import { getNanoDbForUser } from "@libs/couch/dbHelpers"
import { getParametersValue } from "@libs/ssm"
import { deleteLock } from "@libs/supabase/deleteLock"
import { supabase } from "@libs/supabase/client"
import { withMiddy } from "@libs/middy/withMiddy"
import { sync } from "@libs/sync/sync"

const lambda: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (
  event,
) => {
  const { dataSourceId } = event.body
  const lockId = `sync_${dataSourceId}`

  try {
    const [client_id = ``, client_secret = ``, jwtPrivateKey = ``] =
      await getParametersValue({
        Names: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "jwt-private-key"],
        WithDecryption: true,
      })

    configureGoogleDataSource({
      client_id,
      client_secret,
    })

    const credentials = JSON.parse(event.body.credentials ?? JSON.stringify({}))
    const authorization = event.body.authorization ?? ``

    const { name } = await getAuthTokenAsync(
      {
        headers: {
          authorization,
        },
      },
      jwtPrivateKey,
    )

    if (!dataSourceId) {
      throw createHttpError(400)
    }

    await sync({
      userName: name,
      dataSourceId,
      db: await getNanoDbForUser(name, jwtPrivateKey),
      credentials,
      authorization,
    })

    await deleteLock(supabase, lockId)
  } catch (e) {
    await deleteLock(supabase, lockId)

    throw e
  }

  return {
    statusCode: 200,
    body: JSON.stringify({}),
  }
}

export const main = withMiddy(lambda, {
  withCors: false,
  withJsonBodyParser: false,
})
