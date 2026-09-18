import {
  type DataSourceType,
  ObokuErrorCode,
  ObokuSharedError,
  type ProviderApiCredentials,
  parseProviderApiCredentials,
} from "@oboku/shared"
import { Injectable, Logger } from "@nestjs/common"
import { EventEmitter2 } from "@nestjs/event-emitter"
import type { AuthUser } from "src/auth/auth.guard"
import { CouchService, emailToNameHex } from "src/couch/couch.service"
import { atomicUpdate, findOne } from "src/couch/dbHelpers"
import { CoversService } from "src/covers/covers.service"
import {
  BooksMetadataRefreshEvent,
  CollectionMetadataRefreshEvent,
  Events,
} from "src/events"
import { NotificationsService } from "src/notifications/notifications.service"
import { SyncReportPostgresService } from "src/features/postgres/SyncReportPostgresService"
import { getPlugin } from "src/plugins/plugins"
import type {
  SynchronizeAbleDataSource,
  SynchronizeAbleItem,
} from "src/plugins/types"
import { SyncReport } from "./sync/SyncReport"
import { synchronizeFromDataSource } from "./sync/synchronizeFromDataSource"

@Injectable()
export class DataSourceService {
  private readonly logger = new Logger(DataSourceService.name)

  constructor(
    private readonly coversService: CoversService,
    private readonly syncReportPostgresService: SyncReportPostgresService,
    private readonly notificationService: NotificationsService,
    private readonly eventEmitter: EventEmitter2,
    private readonly couchService: CouchService,
  ) {}

  async sync({
    dataSourceId,
    providerCredentials,
    user,
  }: {
    dataSourceId: string
    providerCredentials: ProviderApiCredentials<DataSourceType>
    user: AuthUser
  }) {
    const { email } = user
    const db = await this.couchService.createNanoInstanceForUser({ email })
    const syncReport = new SyncReport(dataSourceId, email)
    let parsedProviderCredentials = providerCredentials

    this.logger.log(`started sync for ${dataSourceId} with user ${email}`)

    const refreshBookMetadata = async ({ bookId }: { bookId: string }) => {
      this.logger.log(`refreshBookMetadata request for ${bookId}`)

      syncReport.fetchBookMetadata(bookId)

      this.eventEmitter.emit(
        Events.BOOKS_METADATA_REFRESH,
        new BooksMetadataRefreshEvent({
          bookId,
          providerCredentials: parsedProviderCredentials,
          email,
        }),
      )
    }

    try {
      const dataSource = await findOne(
        "datasource",
        { selector: { _id: dataSourceId } },
        { db },
      )

      if (!dataSource) throw new Error("Data source not found")

      const { type } = dataSource
      parsedProviderCredentials = parseProviderApiCredentials(
        type,
        providerCredentials,
      )

      // we create the date now on purpose so that if something change on the datasource
      // during the process (which can take time), user will not be misled to believe its
      // latest changes have been synced
      const lastSyncedAt = Date.now()
      const plugin = getPlugin(type)
      if (!plugin?.sync) {
        throw new Error("plugin does not support sync")
      }

      const syncOptions = {
        dataSourceId,
        userName: email,
        providerCredentials: parsedProviderCredentials,
        dataSourceType: type,
        dataSource,
        db,
        syncReport,
      }

      const ctx = {
        ...syncOptions,
        userNameHex: emailToNameHex(email),
        email,
        plugin,
        refreshBookMetadata,
      }

      const applyTags = <T extends SynchronizeAbleItem>(item: T): T => ({
        ...item,
        tags: dataSource.tags,
        items: item.items?.map(applyTags),
      })

      const synchronizeAbleDataSource = await plugin.sync(syncOptions)
      const synchronizeAbleDataSourceWithTags: SynchronizeAbleDataSource = {
        ...synchronizeAbleDataSource,
        items: synchronizeAbleDataSource.items.map(applyTags),
      }

      this.logger.log(
        `Execute sync process with ${plugin.type} plugin`,
        synchronizeAbleDataSourceWithTags,
      )

      const collectionIdsToRefresh = await synchronizeFromDataSource(
        synchronizeAbleDataSourceWithTags,
        ctx,
        this.coversService,
      )

      for (const collectionId of collectionIdsToRefresh) {
        this.eventEmitter.emit(
          Events.COLLECTION_METADATA_REFRESH,
          new CollectionMetadataRefreshEvent({
            collectionId,
            providerCredentials: parsedProviderCredentials,
            soft: true,
            email,
          }),
        )
      }

      this.logger.log(`Update datasource with sync success flag`)

      await atomicUpdate(db, "datasource", dataSourceId, (old) => ({
        ...old,
        lastSyncedAt,
        lastSyncErrorCode: null,
        syncStatus: null,
      }))

      this.logger.log(`sync for ${dataSourceId} completed successfully`)
    } catch (e) {
      syncReport.fail()

      let lastSyncErrorCode = ObokuErrorCode.ERROR_DATASOURCE_UNKNOWN
      if (e instanceof ObokuSharedError) {
        lastSyncErrorCode = e.code
      }

      await atomicUpdate(db, "datasource", dataSourceId, (old) => ({
        ...old,
        lastSyncErrorCode,
        syncStatus: null,
      }))

      throw e
    } finally {
      syncReport.end()

      const syncReportData = syncReport.prepare()

      await this.syncReportPostgresService.save(syncReportData)
      await this.notificationService.sendSyncFinishedNotification({
        userId: user.userId,
        dataSourceId,
        state: syncReportData.state,
      })
    }
  }
}
