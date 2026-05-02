import { Injectable, Logger } from "@nestjs/common"
import { atomicUpdate, findOne } from "src/lib/couch/dbHelpers"
import { retrieveMetadataAndSaveCover } from "../features/metadata/retrieveMetadataAndSaveCover"
import { CouchService, emailToNameHex } from "src/couch/couch.service"
import { AppConfigService } from "../config/AppConfigService"
import { CoversService } from "src/covers/covers.service"
import { ProviderApiCredentials } from "@oboku/shared"
import { DataSourceType } from "@oboku/shared"

@Injectable()
export class BooksMetadataService {
  private readonly logger = new Logger(BooksMetadataService.name)

  constructor(
    private readonly appConfigService: AppConfigService,
    private readonly couchService: CouchService,
    private readonly coversService: CoversService,
  ) {}

  public refreshMetadata = async (
    body: { bookId: string },
    providerCredentials: ProviderApiCredentials<DataSourceType>,
    userEmail: string,
  ) => {
    const { bookId } = body

    const userNameHex = emailToNameHex(userEmail)

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

    let _data: Awaited<ReturnType<typeof retrieveMetadataAndSaveCover>>

    try {
      _data = await retrieveMetadataAndSaveCover(
        {
          userName: userEmail,
          userNameHex,
          providerCredentials,
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

    if (_data.link.contentLength !== undefined) {
      await atomicUpdate(db, "link", link._id, (old) => ({
        ...old,
        contentLength: _data.link.contentLength,
      }))
    }

    this.logger.log(`lambda executed with success for ${book._id}`)
  }
}
