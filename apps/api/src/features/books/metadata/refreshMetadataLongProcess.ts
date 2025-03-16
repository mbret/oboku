import { ConfigService } from "@nestjs/config"
import * as fs from "node:fs"
import * as path from "node:path"
import { EnvironmentVariables } from "src/types"
import { createSupabaseClient } from "src/lib/supabase/client"
import { Logger } from "@nestjs/common"
import { getParametersValue } from "src/lib/ssm"
import { configure } from "src/lib/plugins/google"
import { findOne } from "src/lib/couch/dbHelpers"
import { atomicUpdate } from "src/lib/couch/dbHelpers"
import { getAuthTokenAsync } from "src/lib/auth"
import { getNanoDbForUser } from "src/lib/couch/dbHelpers"
import { PromiseReturnType } from "src/lib/types"
import { retrieveMetadataAndSaveCover } from "src/features/metadata/retrieveMetadataAndSaveCover"
import { deleteLock } from "src/lib/supabase/deleteLock"

export const refreshMetadataLongProcess = async (
  {
    authorization,
    bookId,
    rawCredentials,
  }: { bookId: string; authorization: string; rawCredentials: string },
  config: ConfigService<EnvironmentVariables>,
  supabase: ReturnType<typeof createSupabaseClient>,
) => {
  Logger.log("refreshMetadata")
  const lockId = `metadata_${bookId}`

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

    configure({
      client_id,
      client_secret,
    })

    const TMP_DIR_BOOKS = config.getOrThrow("TMP_DIR_BOOKS", { infer: true })

    if (!config.getOrThrow("OFFLINE", { infer: true })) {
      const files = await fs.promises.readdir(TMP_DIR_BOOKS)

      await Promise.all(
        files.map((file) => {
          return fs.promises.unlink(path.join(TMP_DIR_BOOKS, file))
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

    const db = await getNanoDbForUser(
      userName,
      jwtPrivateKey,
      config.getOrThrow("COUCH_DB_URL", { infer: true }),
    )

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
      data = await retrieveMetadataAndSaveCover(
        {
          userName,
          userNameHex,
          credentials,
          book,
          link,
          googleApiKey,
          db,
        },
        config,
      )
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

    Logger.log(`lambda executed with success for ${book._id}`)
  } catch (error) {
    await deleteLock(supabase, lockId)

    throw error
  }
}
