import type createNano from "nano"
import { SyncReport } from "./SyncReport"
import { synchronizeFromDataSource } from "./synchronizeFromDataSource"
import { ObokuErrorCode, ObokuSharedError } from "@oboku/shared"
import { createHelpers } from "../plugins/helpers"
import { atomicUpdate } from "../couch/dbHelpers"
import { plugins } from "../plugins/plugins"
import { ConfigService } from "@nestjs/config"
import { EnvironmentVariables } from "src/config/types"
import { EventEmitter2 } from "@nestjs/event-emitter"
import { BooksMetadataRefreshEvent, Events } from "src/events"
import { SyncReportPostgresService } from "src/features/postgres/SyncReportPostgresService"
import { CoversService } from "src/covers/covers.service"

export const sync = async ({
  dataSourceId,
  userName,
  credentials,
  authorization,
  db,
  config,
  eventEmitter,
  syncReportPostgresService,
  email,
  coversService,
}: {
  dataSourceId: string
  userName: string
  credentials?: any
  authorization: string
  db: createNano.DocumentScope<unknown>
  config: ConfigService<EnvironmentVariables>
  eventEmitter: EventEmitter2
  syncReportPostgresService: SyncReportPostgresService
  email: string
  coversService: CoversService
}) => {
  const syncReport = new SyncReport(dataSourceId, userName)

  console.log(
    `dataSourceFacade started sync for ${dataSourceId} with user ${userName}`,
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
        authorization,
        obokuCredentials: credentials,
        email,
      }),
    )
  }

  const nameHex = Buffer.from(userName).toString("hex")
  const helpers = createHelpers(refreshBookMetadata, db)

  try {
    const dataSource = await helpers.findOne("datasource", {
      selector: { _id: dataSourceId },
    })

    if (!dataSource) throw new Error("Data source not found")

    if (dataSource.syncStatus !== "fetching") {
      await atomicUpdate(db, "datasource", dataSource._id, (old) => ({
        ...old,
        syncStatus: "fetching" as const,
      }))
    }

    const { type } = dataSource

    // we create the date now on purpose so that if something change on the datasource
    // during the process (which can take time), user will not be misled to believe its
    // latest changes have been synced
    const lastSyncedAt = new Date().getTime()
    const ctx = {
      dataSourceId,
      userName,
      credentials,
      dataSourceType: type,
      authorization,
      db,
      syncReport,
      userNameHex: nameHex,
      email,
    }
    const plugin = plugins.find((plugin) => plugin.type === type)

    if (!plugin?.sync) {
      throw new Error("plugin does not support sync")
    }

    const synchronizeAbleDataSource = await plugin?.sync(ctx, helpers)

    console.log(`Execute sync process with ${plugin?.type} plugin`)

    if (synchronizeAbleDataSource) {
      await synchronizeFromDataSource(
        synchronizeAbleDataSource,
        ctx,
        helpers,
        config,
        eventEmitter,
        coversService,
      )
    }

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
  }
}
