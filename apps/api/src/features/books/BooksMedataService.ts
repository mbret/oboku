import { Injectable, Logger } from "@nestjs/common"
import * as fs from "node:fs"
import * as path from "node:path"
import { atomicUpdate, findOne } from "src/lib/couch/dbHelpers"
import { retrieveMetadataAndSaveCover } from "../metadata/retrieveMetadataAndSaveCover"
import { CouchService } from "src/couch/couch.service"
import { AppConfigService } from "../../config/AppConfigService"
import { CoversService } from "src/covers/covers.service"

@Injectable()
export class BooksMedataService {
  constructor(
    private readonly appConfigService: AppConfigService,
    private readonly couchService: CouchService,
    private readonly coversService: CoversService,
  ) {}

  refreshMetadata = async (
    body: { bookId: string },
    headers: {
      "oboku-credentials"?: string
      authorization?: string
    },
    userEmail: string,
  ) => {
    const { bookId } = body
    const credentials = JSON.parse(headers["oboku-credentials"] ?? "{}")

    const files = await fs.promises.readdir(this.appConfigService.TMP_DIR_BOOKS)

    await Promise.all(
      files.map((file) => {
        return fs.promises.unlink(
          path.join(this.appConfigService.TMP_DIR_BOOKS, file),
        )
      }),
    )

    const userNameHex = Buffer.from(userEmail).toString("hex")

    const db = await this.couchService.createNanoInstanceForUser({
      email: userEmail,
    })

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

    let data: Awaited<ReturnType<typeof retrieveMetadataAndSaveCover>>

    try {
      data = await retrieveMetadataAndSaveCover(
        {
          userName: userEmail,
          userNameHex,
          credentials,
          book,
          link,
          googleApiKey: this.appConfigService.GOOGLE_API_KEY,
          db,
        },
        this.appConfigService,
        this.coversService,
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
