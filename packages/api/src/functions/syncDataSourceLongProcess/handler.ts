import { ValidatedEventAPIGatewayProxyEvent } from "@libs/api-gateway"
import { withMiddy } from "@libs/lambda"
import { AWS_API_URI } from "../../constants"
import { configure as configureGoogleDataSource } from "@libs/plugins/google"
import { HeadObjectCommand, S3Client } from "@aws-sdk/client-s3"
import { withToken } from "@libs/auth"
import schema from "./schema"
import { createHttpError } from "@libs/httpErrors"
import { dataSourceFacade } from "@libs/plugins"
import { getNanoDbForUser } from "@libs/couch/dbHelpers"
import axios from "axios"
import { getParameterValue } from "@libs/ssm"
import { deleteLock } from "@libs/supabase/deleteLock"
import { supabase } from "@libs/supabase/client"

const s3 = new S3Client()

const lambda: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (
  event
) => {
  const { dataSourceId } = event.body
  const lockId = `sync_${dataSourceId}`

  try {
    configureGoogleDataSource({
      client_id:
        (await getParameterValue({
          Name: `GOOGLE_CLIENT_ID`,
          WithDecryption: true
        })) ?? ``,
      client_secret:
        (await getParameterValue({
          Name: `GOOGLE_CLIENT_SECRET`,
          WithDecryption: true
        })) ?? ``
    })

    const credentials = JSON.parse(event.body.credentials ?? JSON.stringify({}))
    const authorization = event.body.authorization ?? ``

    const { name } = await withToken({
      headers: {
        authorization
      }
    })

    if (!dataSourceId) {
      throw createHttpError(400)
    }

    const refreshBookMetadata = ({ bookId }: { bookId: string }) =>
      axios({
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

    const isBookCoverExist = async ({ coverId }: { coverId: string }) => {
      try {
        await s3.send(
          new HeadObjectCommand({
            Bucket: "oboku-covers",
            Key: `cover-${coverId}`
          })
        )

        return true
      } catch (e) {
        if ((e as any)?.$metadata?.httpStatusCode === 404) return false
        if ((e as any).code === "NotFound") return false
        throw e
      }
    }

    await dataSourceFacade.sync({
      userName: name,
      dataSourceId,
      db: await getNanoDbForUser(name),
      refreshBookMetadata,
      isBookCoverExist,
      credentials,
      authorization
    })

    deleteLock(supabase, lockId)
  } catch (e) {
    deleteLock(supabase, lockId)

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
