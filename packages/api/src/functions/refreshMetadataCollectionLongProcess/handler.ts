import { ValidatedEventAPIGatewayProxyEvent } from "@libs/api-gateway"
import { withMiddy } from "@libs/lambda"
import { withToken } from "@libs/auth"
import { configure as configureGoogleDataSource } from "@libs/plugins/google"
import schema from "./schema"
import { findOne, getNanoDbForUser } from "@libs/couch/dbHelpers"
import { getParameterValue } from "@libs/ssm"
import { deleteLock } from "@libs/supabase/deleteLock"
import { supabase } from "@libs/supabase/client"
import { Logger } from "@libs/logger"
import { refreshMetadata } from "@libs/collections/refreshMetadata"

const logger = Logger.namespace("refreshMetadataCollectionLongProcess")

const lambda: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (
  event
) => {
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

  const googleApiKey = await getParameterValue({
    Name: `GOOGLE_API_KEY`,
    WithDecryption: true
  })

  const authorization = event.body.authorization ?? ``

  const { name: userName } = await withToken({
    headers: {
      authorization
    }
  })
  const collectionId: string | undefined = event.body.collectionId

  if (!collectionId) {
    throw new Error(`Unable to parse event.body -> ${event.body}`)
  }

  const lockId = `metadata-collection_${collectionId}`

  const db = await getNanoDbForUser(userName)

  const collection = await findOne(db, "obokucollection", {
    selector: { _id: collectionId }
  })

  if (!collection) throw new Error(`Unable to find book ${collectionId}`)

  if (collection.type === "shelve") {
    logger.log(`Ignoring ${collection._id} because of type ${collection.type}`)

    await deleteLock(supabase, lockId)

    return {
      statusCode: 200,
      body: JSON.stringify({})
    }
  }

  console.log(collection)

  try {
    await refreshMetadata(collection, {
      googleApiKey
    })
  } catch (e) {
    await deleteLock(supabase, lockId)

    throw e
  }

  await deleteLock(supabase, lockId)

  Logger.log(`lambda executed with success for ${collection._id}`)

  return {
    statusCode: 200,
    body: JSON.stringify({})
  }
}

export const main = withMiddy(lambda, {
  withCors: false,
  withJsonBodyParser: false
})
