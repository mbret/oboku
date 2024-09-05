import { ValidatedEventAPIGatewayProxyEvent } from "@libs/api-gateway"
import { withMiddy } from "@libs/lambda"
import { withToken } from "@libs/auth"
import { configure as configureGoogleDataSource } from "@libs/plugins/google"
import schema from "./schema"
import { findOne, getNanoDbForUser } from "@libs/couch/dbHelpers"
import { getParametersValue } from "@libs/ssm"
import { deleteLock } from "@libs/supabase/deleteLock"
import { supabase } from "@libs/supabase/client"
import { Logger } from "@libs/logger"
import { refreshMetadata } from "./src/refreshMetadata"

const lambda: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (
  event
) => {
  const [
    client_id = ``,
    client_secret = ``,
    googleApiKey = ``,
    jwtPrivateKey = ``,
    comicVineApiKey = ``
  ] = await getParametersValue({
    Names: [
      "GOOGLE_CLIENT_ID",
      "GOOGLE_CLIENT_SECRET",
      "GOOGLE_API_KEY",
      "jwt-private-key",
      "COMiCVINE_API_KEY"
    ],
    WithDecryption: true
  })

  configureGoogleDataSource({
    client_id,
    client_secret
  })

  const soft = event.body.soft === true
  const authorization = event.body.authorization ?? ``
  const rawCredentials = event.body.credentials ?? JSON.stringify({})
  const credentials = JSON.parse(rawCredentials)

  const { name: userName } = await withToken(
    {
      headers: {
        authorization
      }
    },
    jwtPrivateKey
  )

  const collectionId: string | undefined = event.body.collectionId

  if (!collectionId) {
    throw new Error(`Unable to parse event.body -> ${event.body}`)
  }

  const lockId = `metadata-collection_${collectionId}`

  const db = await getNanoDbForUser(userName, jwtPrivateKey)

  const collection = await findOne(db, "obokucollection", {
    selector: { _id: collectionId }
  })

  if (!collection) throw new Error(`Unable to find book ${collectionId}`)

  try {
    await refreshMetadata(collection, {
      googleApiKey,
      db,
      credentials,
      soft,
      comicVineApiKey
    })
  } catch (e) {
    await deleteLock(supabase, lockId)

    throw e
  }

  await deleteLock(supabase, lockId)

  Logger.info(`lambda executed with success for ${collection._id}`)

  return {
    statusCode: 200,
    body: JSON.stringify({})
  }
}

export const main = withMiddy(lambda, {
  withCors: false,
  withJsonBodyParser: false
})
