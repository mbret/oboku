import { Injectable, Logger } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { EnvironmentVariables } from "src/types"
import { getParametersValue } from "src/lib/ssm"
import { configure } from "src/lib/plugins/google"
import * as fs from "node:fs"
import * as path from "node:path"
import {
  atomicUpdate,
  findOne,
  getNanoDbForUser,
} from "src/lib/couch/dbHelpers"
import { getAuthTokenAsync } from "src/lib/auth"
import { PromiseReturnType } from "src/lib/types"
import { retrieveMetadataAndSaveCover } from "../metadata/retrieveMetadataAndSaveCover"

@Injectable()
export class BooksMedataService {
  constructor(
    private readonly configService: ConfigService<EnvironmentVariables>,
  ) {}

  refreshMetadata = async (
    body: { bookId: string },
    headers: {
      "oboku-credentials"?: string
      authorization?: string
    },
  ) => {
    const { bookId } = body
    const { authorization } = headers
    const credentials = JSON.parse(headers["oboku-credentials"] ?? "{}")

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

    const TMP_DIR_BOOKS = this.configService.getOrThrow("TMP_DIR_BOOKS", {
      infer: true,
    })

    if (!this.configService.getOrThrow("OFFLINE", { infer: true })) {
      const files = await fs.promises.readdir(TMP_DIR_BOOKS)

      await Promise.all(
        files.map((file) => {
          return fs.promises.unlink(path.join(TMP_DIR_BOOKS, file))
        }),
      )
    }

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
      this.configService.getOrThrow("COUCH_DB_URL", { infer: true }),
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
        this.configService,
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
    ])

    Logger.log(`lambda executed with success for ${book._id}`)
  }
}
