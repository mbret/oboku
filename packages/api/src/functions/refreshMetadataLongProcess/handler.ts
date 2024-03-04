import { ValidatedEventAPIGatewayProxyEvent } from "@libs/api-gateway"
import { withMiddy } from "@libs/lambda"
import fs from "fs"
import path from "path"
import { OFFLINE, TMP_DIR } from "../../constants"
import { withToken } from "@libs/auth"
import { configure as configureGoogleDataSource } from "@libs/plugins/google"
import schema from "./schema"
import { atomicUpdate, findOne, getNanoDbForUser } from "@libs/couch/dbHelpers"
import { PromiseReturnType } from "@libs/types"
import { retrieveMetadataAndSaveCover } from "@libs/books/retrieveMetadataAndSaveCover"
import { getParameterValue } from "@libs/ssm"
import { deleteLock } from "@libs/supabase/deleteLock"
import { supabase } from "@libs/supabase/client"

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

  if (!OFFLINE) {
    const files = await fs.promises.readdir(TMP_DIR)

    await Promise.all(
      files.map((file) => {
        return fs.promises.unlink(path.join(TMP_DIR, file))
      })
    )
  }

  const authorization = event.body.authorization ?? ``
  const rawCredentials = event.body.credentials ?? JSON.stringify({})
  const credentials = JSON.parse(rawCredentials)

  const { name: userName } = await withToken({
    headers: {
      authorization
    }
  })
  const userNameHex = Buffer.from(userName).toString("hex")
  const bookId: string | undefined = event.body.bookId

  if (!bookId) {
    throw new Error(`Unable to parse event.body -> ${event.body}`)
  }

  const lockId = `metadata_${event.body.bookId}`

  const db = await getNanoDbForUser(userName)

  const book = await findOne(db, "book", { selector: { _id: bookId } })

  if (!book) throw new Error(`Unable to find book ${bookId}`)

  if (book.metadataUpdateStatus !== "fetching") {
    await atomicUpdate(db, "book", book._id, (old) => ({
      ...old,
      metadataUpdateStatus: "fetching" as const
    }))
  }

  const firstLinkId = (book.links || [])[0] || "-1"

  const link = await findOne(db, "link", { selector: { _id: firstLinkId } })

  if (!link) throw new Error(`Unable to find link ${firstLinkId}`)

  let data: PromiseReturnType<typeof retrieveMetadataAndSaveCover>

  try {
    data = await retrieveMetadataAndSaveCover({
      userName,
      userNameHex,
      credentials,
      book,
      link,
      googleApiKey,
      db
    })
  } catch (e) {
    await atomicUpdate(db, "book", book._id, (old) => ({
      ...old,
      metadataUpdateStatus: null,
      lastMetadataUpdateError: "unknown"
    }))

    await deleteLock(supabase, lockId)

    throw e
  }

  await Promise.all([
    atomicUpdate(db, "book", book._id, (old) => ({
      ...old,
      ...data.book,
      lastMetadataUpdatedAt: new Date().getTime(),
      metadataUpdateStatus: null,
      lastMetadataUpdateError: null
    })),
    atomicUpdate(db, "link", link._id, (old) => ({
      ...old,
      contentLength: data.link.contentLength
    })),
    deleteLock(supabase, lockId)
  ])

  return {
    statusCode: 200,
    body: JSON.stringify({})
  }
}

export const main = withMiddy(lambda, {
  withCors: false,
  withJsonBodyParser: false
})
