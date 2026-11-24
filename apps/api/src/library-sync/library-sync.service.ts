import {
  type SourceType,
  ObokuErrorCode,
  ObokuSharedError,
  type SourceApiCredentials,
  parseSourceApiCredentials,
} from "@oboku/shared"
import { Injectable, Logger } from "@nestjs/common"
import { EventEmitter2 } from "@nestjs/event-emitter"
import type { AuthUser } from "../auth/auth.guard.js"
import { CouchService, emailToNameHex } from "../couch/couch.service.js"
import { atomicUpdate, findOne } from "../couch/dbHelpers.js"
import { CoversService } from "../covers/covers.service.js"
import {
  BooksMetadataRefreshEvent,
  CollectionMetadataRefreshEvent,
  Events,
} from "../events.js"
import { SyncReportPostgresService } from "../features/postgres/SyncReportPostgresService.js"
import { isNonPublicAddressError } from "../http/publicAddress.js"
import { NotificationsService } from "../notifications/notifications.service.js"
import { getPlugin } from "../plugins/plugins.js"
import type {
  SynchronizeAbleLibrarySync,
  SynchronizeAbleItem,
} from "../plugins/types.js"
import { SyncReport } from "./sync/SyncReport.js"
import { synchronizeFromLibrarySync } from "./sync/synchronizeFromLibrarySync.js"

function toSyncErrorCode(error: unknown) {
  if (isNonPublicAddressError(error)) {
    return ObokuErrorCode.ERROR_ADDRESS_NOT_ALLOWED
  }

  if (error instanceof ObokuSharedError) {
    return error.code
  }

  return ObokuErrorCode.ERROR_DATASOURCE_UNKNOWN
}

@Injectable()
export class LibrarySyncService {
  private readonly logger = new Logger(LibrarySyncService.name)

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
    providerCredentials: SourceApiCredentials<SourceType>
    user: AuthUser
  }) {
    const { email } = user
    const db = await this.couchService.createNanoInstanceForUser({ email })
    const syncReport = new SyncReport(dataSourceId, email)
    let parsedSourceCredentials = providerCredentials

    this.logger.log(`started sync for ${dataSourceId} with user ${email}`)

    const refreshBookMetadata = async ({ bookId }: { bookId: string }) => {
      this.logger.log(`refreshBookMetadata request for ${bookId}`)

      syncReport.fetchBookMetadata(bookId)

      this.eventEmitter.emit(
        Events.BOOKS_METADATA_REFRESH,
        new BooksMetadataRefreshEvent({
          bookId,
          providerCredentials: parsedSourceCredentials,
          email,
        }),
      )
    }

    try {
      const librarySync = await findOne(
        "datasource",
        { selector: { _id: dataSourceId } },
        { db },
      )

      if (!librarySync) throw new Error("Library sync not found")

      const { type } = librarySync
      parsedSourceCredentials = parseSourceApiCredentials(
        type,
        providerCredentials,
      )

      // we create the date now on purpose so that if something change on the library sync
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
        providerCredentials: parsedSourceCredentials,
        sourceType: type,
        librarySync,
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
        tags: librarySync.tags,
        items: item.items?.map(applyTags),
      })

      const synchronizeAbleLibrarySync = await plugin.sync(syncOptions)
      const synchronizeAbleLibrarySyncWithTags: SynchronizeAbleLibrarySync = {
        ...synchronizeAbleLibrarySync,
        items: synchronizeAbleLibrarySync.items.map(applyTags),
      }

      this.logger.log(
        `Execute sync process with ${plugin.type} plugin for ${synchronizeAbleLibrarySyncWithTags.items.length} items`,
      )

      const collectionIdsToRefresh = await synchronizeFromLibrarySync(
        synchronizeAbleLibrarySyncWithTags,
        ctx,
        this.coversService,
      )

      for (const collectionId of collectionIdsToRefresh) {
        this.eventEmitter.emit(
          Events.COLLECTION_METADATA_REFRESH,
          new CollectionMetadataRefreshEvent({
            collectionId,
            providerCredentials: parsedSourceCredentials,
            soft: true,
            email,
          }),
        )
      }

      this.logger.log(`Update the library sync with its sync success flag`)

      await atomicUpdate(db, "datasource", dataSourceId, (old) => ({
        ...old,
        lastSyncedAt,
        lastSyncErrorCode: null,
        syncStatus: null,
      }))

      this.logger.log(`sync for ${dataSourceId} completed successfully`)
    } catch (e) {
      const lastSyncErrorCode = toSyncErrorCode(e)

      syncReport.fail(lastSyncErrorCode)

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
