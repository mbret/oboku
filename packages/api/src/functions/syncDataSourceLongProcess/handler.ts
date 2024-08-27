import { ValidatedEventAPIGatewayProxyEvent } from "@libs/api-gateway"
import { withMiddy } from "@libs/lambda"
import { AWS_API_URI } from "../../constants"
import { configure as configureGoogleDataSource } from "@libs/plugins/google"
import { withToken } from "@libs/auth"
import schema from "./schema"
import { createHttpError } from "@libs/httpErrors"
import { getNanoDbForUser } from "@libs/couch/dbHelpers"
import axios from "axios"
import { getParametersValue } from "@libs/ssm"
import { deleteLock } from "@libs/supabase/deleteLock"
import { supabase } from "@libs/supabase/client"
import { pluginFacade } from "@libs/plugins/facade"
import { Logger } from "@libs/logger"

const logger = Logger.child({ module: "handler" })

const lambda: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (
  event
) => {
  const { dataSourceId } = event.body
  const lockId = `sync_${dataSourceId}`

  try {
    const [client_id = ``, client_secret = ``, jwtPrivateKey = ``] =
      await getParametersValue({
        Names: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "jwt-private-key"],
        WithDecryption: true
      })

    configureGoogleDataSource({
      client_id,
      client_secret
    })

    const credentials = JSON.parse(event.body.credentials ?? JSON.stringify({}))
    const authorization = event.body.authorization ?? ``

    const { name } = await withToken(
      {
        headers: {
          authorization
        }
      },
      jwtPrivateKey
    )

    if (!dataSourceId) {
      throw createHttpError(400)
    }

    const refreshBookMetadata = async ({ bookId }: { bookId: string }) => {
      logger.info(`send refreshBookMetadata request for ${bookId}`)

      const response = await axios({
        method: `post`,
        url: `${AWS_API_URI}/refresh-metadata`,
        data: {
          bookId
        },
        headers: {
          "content-type": "application/json",
          accept: "application/json",
          "oboku-credentials": JSON.stringify(credentials),
          authorization: authorization
        }
      })

      logger.info(`refreshBookMetadata request success for ${bookId}`)
      logger.info(response)
    }

    await pluginFacade.sync({
      userName: name,
      dataSourceId,
      db: await getNanoDbForUser(name, jwtPrivateKey),
      refreshBookMetadata,
      credentials,
      authorization
    })

    await deleteLock(supabase, lockId)
  } catch (e) {
    await deleteLock(supabase, lockId)

    throw e
  }

  return {
    statusCode: 200,
    body: JSON.stringify({})
  }
}

export const main = withMiddy(lambda, {
  withCors: false,
  withJsonBodyParser: false
})
