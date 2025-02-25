import type { ValidatedEventAPIGatewayProxyEvent } from "@libs/api-gateway"
import fs from "node:fs"
import path from "node:path"
import { OFFLINE, TMP_DIR } from "../../constants"
import { getAuthTokenAsync } from "@libs/auth"
import { configure as configureGoogleDataSource } from "@libs/plugins/google"
import type schema from "./schema"
import { atomicUpdate, findOne, getNanoDbForUser } from "@libs/couch/dbHelpers"
import type { PromiseReturnType } from "@libs/types"
import { getParametersValue } from "@libs/ssm"
import { deleteLock } from "@libs/supabase/deleteLock"
import { supabase } from "@libs/supabase/client"
import { Logger } from "@libs/logger"
import { retrieveMetadataAndSaveCover } from "./src/retrieveMetadataAndSaveCover"
import { withMiddy } from "@libs/middy/withMiddy"

const lambda: ValidatedEventAPIGatewayProxyEvent<typeof schema> = async (
  event,
) => {
  const bookId = event.body.bookId
  const lockId = `metadata_${bookId}`
  const authorization = event.body.authorization ?? ``
  const rawCredentials = event.body.credentials ?? JSON.stringify({})

  try {
    const [
      client_id = ``,
      client_secret = ``,
      googleApiKey = ``,
      jwtPrivateKey = ``,
    ] = await getParametersValue({
      Names: [
        "GOOGLE_CLIENT_ID",
        "GOOGLE_CLIENT_SECRET",
        "GOOGLE_API_KEY",
        "jwt-private-key",
      ],
      WithDecryption: true,
    })

    configureGoogleDataSource({
      client_id,
      client_secret,
    })

    if (!OFFLINE) {
      const files = await fs.promises.readdir(TMP_DIR)

      await Promise.all(
        files.map((file) => {
          return fs.promises.unlink(path.join(TMP_DIR, file))
        }),
      )
    }

    const credentials = JSON.parse(rawCredentials)

    const { name: userName } = await getAuthTokenAsync(
      {
        headers: {
          authorization,
        },
      },
      jwtPrivateKey,
    )
    const userNameHex = Buffer.from(userName).toString("hex")
    const bookId: string | undefined = event.body.bookId

    if (!bookId) {
      throw new Error(`Unable to parse event.body -> ${event.body}`)
    }

    const db = await getNanoDbForUser(userName, jwtPrivateKey)

    const book = await findOne("book", { selector: { _id: bookId } }, { db })

    if (!book) throw new Error(`Unable to find book ${bookId}`)

    if (book.metadataUpdateStatus !== "fetching") {
      await atomicUpdate(db, "book", book._id, (old) => ({
        ...old,
        metadataUpdateStatus: "fetching" as const,
      }))
    }

    const firstLinkId = (book.links || [])[0] || "-1"

    const link = await findOne(
      "link",
      { selector: { _id: firstLinkId } },
      { db },
    )

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
        db,
      })
    } catch (e) {
      await atomicUpdate(db, "book", book._id, (old) => ({
        ...old,
        metadataUpdateStatus: null,
        lastMetadataUpdateError: "unknown",
      }))

      throw e
    }

    await Promise.all([
      atomicUpdate(db, "link", link._id, (old) => ({
        ...old,
        contentLength: data.link.contentLength,
      })),
      deleteLock(supabase, lockId),
    ])

    Logger.info(`lambda executed with success for ${book._id}`)
  } catch (error) {
    await deleteLock(supabase, lockId)

    throw error
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
