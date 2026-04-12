import type createNano from "nano"
import { SyncReport } from "./SyncReport"
import { synchronizeFromDataSource } from "./synchronizeFromDataSource"
import {
  ObokuErrorCode,
  ObokuSharedError,
  parseProviderApiCredentials,
} from "@oboku/shared"
import { createHelpers } from "src/features/plugins/helpers"
import { atomicUpdate } from "../couch/dbHelpers"
import { emailToNameHex } from "src/couch/couch.service"
import { getPlugin } from "src/features/plugins/plugins"
import { ConfigService } from "@nestjs/config"
import { EnvironmentVariables } from "src/config/types"
import { EventEmitter2 } from "@nestjs/event-emitter"
import { BooksMetadataRefreshEvent, Events } from "src/events"
import { NotificationsService } from "src/notifications/notifications.service"
import { SyncReportPostgresService } from "src/features/postgres/SyncReportPostgresService"
import { CoversService } from "src/covers/covers.service"
import type { DataSourceType, ProviderApiCredentials } from "@oboku/shared"
import type { AuthUser } from "src/auth/auth.guard"
import {
  SynchronizeAbleDataSource,
  SynchronizeAbleItem,
} from "src/features/plugins/types"

export const sync = async ({
  dataSourceId,
  user,
  providerCredentials,
  db,
  config,
  eventEmitter,
  syncReportPostgresService,
  notificationService,
  coversService,
}: {
  dataSourceId: string
  user: AuthUser
  providerCredentials: ProviderApiCredentials<DataSourceType>
  db: createNano.DocumentScope<unknown>
  config: ConfigService<EnvironmentVariables>
  eventEmitter: EventEmitter2
  syncReportPostgresService: SyncReportPostgresService
  notificationService: NotificationsService
  coversService: CoversService
}) => {
  const { email } = user
  const syncReport = new SyncReport(dataSourceId, email)
  let parsedProviderCredentials = providerCredentials

  console.log(
    `dataSourceFacade started sync for ${dataSourceId} with user ${email}`,
  )

  const refreshBookMetadata = async ({ bookId }: { bookId: string }) => {
    console.log(
      `[syncDataSourceLongProcess] [refreshBookMetadata]`,
      `request for ${bookId}`,
    )

    syncReport.fetchBookMetadata(bookId)

    eventEmitter.emit(
      Events.BOOKS_METADATA_REFRESH,
      new BooksMetadataRefreshEvent({
        bookId,
        providerCredentials: parsedProviderCredentials,
        email,
      }),
    )
  }

  const nameHex = emailToNameHex(email)
  const helpers = createHelpers(refreshBookMetadata, db)

  try {
    const dataSource = await helpers.findOne("datasource", {
      selector: { _id: dataSourceId },
    })

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
      userNameHex: nameHex,
      email,
      plugin,
    }

    const applyTags = <T extends SynchronizeAbleItem>(item: T): T => ({
      ...item,
      tags: dataSource.tags,
      items: item.items?.map(applyTags),
    })

    const synchronizeAbleDataSource = await plugin.sync(syncOptions, helpers)
    const synchronizeAbleDataSourceWithTags: SynchronizeAbleDataSource = {
      ...synchronizeAbleDataSource,
      items: synchronizeAbleDataSource.items.map(applyTags),
    }

    console.log(
      `Execute sync process with ${plugin?.type} plugin`,
      synchronizeAbleDataSourceWithTags,
    )

    await synchronizeFromDataSource(
      synchronizeAbleDataSourceWithTags,
      ctx,
      helpers,
      config,
      eventEmitter,
      coversService,
    )

    console.log(`Update datasource with sync success flag`)

    await atomicUpdate(db, "datasource", dataSourceId, (old) => ({
      ...old,
      lastSyncedAt,
      lastSyncErrorCode: null,
      syncStatus: null,
    }))

    console.log(`dataSourcesSync for ${dataSourceId} completed successfully`)
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

    await syncReportPostgresService.save(syncReportData)
    await notificationService.sendSyncFinishedNotification({
      userId: user.userId,
      dataSourceId,
      state: syncReportData.state,
    })
  }
}
