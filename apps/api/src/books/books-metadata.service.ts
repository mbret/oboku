import { Injectable, Logger } from "@nestjs/common"
import { atomicUpdate, findOne } from "src/lib/couch/dbHelpers"
import { retrieveMetadataAndSaveCover } from "../features/metadata/retrieveMetadataAndSaveCover"
import { CouchService, emailToNameHex } from "src/couch/couch.service"
import { AppConfigService } from "../config/AppConfigService"
import { CoversService } from "src/covers/covers.service"
import { ProviderApiCredentials } from "@oboku/shared"
import { DataSourceType } from "@oboku/shared"
import { PluginsService } from "src/plugins/plugins.service"
import { InstanceConfigService } from "src/admin/instance-config/instance-config.service"

@Injectable()
export class BooksMetadataService {
  private readonly logger = new Logger(BooksMetadataService.name)

  constructor(
    private readonly appConfigService: AppConfigService,
    private readonly couchService: CouchService,
    private readonly coversService: CoversService,
    private readonly pluginsService: PluginsService,
    private readonly instanceConfigService: InstanceConfigService,
  ) {}

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
          googleApiKey: this.appConfigService.GOOGLE_API_KEY,
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
