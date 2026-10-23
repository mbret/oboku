import { Injectable, Logger } from "@nestjs/common"
import { atomicUpdate, findOne } from "../lib/couch/dbHelpers.js"
import { retrieveMetadataAndSaveCover } from "../features/metadata/retrieveMetadataAndSaveCover.js"
import { CouchService, emailToNameHex } from "../couch/couch.service.js"
import { AppConfigService } from "../config/AppConfigService.js"
import { CoversService } from "../covers/covers.service.js"
import { ProviderApiCredentials } from "@oboku/shared"
import { DataSourceType } from "@oboku/shared"
import { PluginsService } from "../plugins/plugins.service.js"
import { InstanceConfigService } from "../admin/instance-config/instance-config.service.js"
import type { MetadataProvider } from "@prose-reader/metadata-fetcher"
import { createCatalogProviders } from "../lib/metadata/catalogProviders.js"

@Injectable()
export class BooksMetadataService {
  private readonly logger = new Logger(BooksMetadataService.name)
  private readonly catalogProviders: ReadonlyArray<MetadataProvider>

  constructor(
    private readonly appConfigService: AppConfigService,
    private readonly couchService: CouchService,
    private readonly coversService: CoversService,
    private readonly pluginsService: PluginsService,
    private readonly instanceConfigService: InstanceConfigService,
  ) {
    this.catalogProviders = createCatalogProviders({
      googleApiKey: appConfigService.GOOGLE_API_KEY,
      googleBooksBaseUrl: appConfigService.GOOGLE_BOOK_API_URL,
    })
  }

  public refreshMetadata = async (
    body: { bookId: string; force?: boolean },
    providerCredentials: ProviderApiCredentials<DataSourceType>,
    userEmail: string,
  ) => {
    const { bookId, force } = body

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

    const { fileDownloadMaxSizeBytes } =
      this.instanceConfigService.getConfig().value

    try {
      await retrieveMetadataAndSaveCover(
        {
          userName: userEmail,
          userNameHex,
          providerCredentials,
          book,
          link,
          catalogProviders: this.catalogProviders,
          db,
          force,
          fileDownloadMaxSizeBytes,
        },
        this.appConfigService,
        this.coversService,
        this.pluginsService,
      )
    } catch (e) {
      await atomicUpdate(db, "book", book._id, (old) => ({
        ...old,
        metadataUpdateStatus: null,
        lastMetadataUpdateError: "unknown",
      }))

      throw e
    }

    this.logger.log(`lambda executed with success for ${book._id}`)
  }
}
