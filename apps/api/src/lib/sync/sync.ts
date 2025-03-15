import type createNano from "nano"
import { SyncReport } from "./SyncReport"
import { synchronizeFromDataSource } from "./synchronizeFromDataSource"
import { ObokuErrorCode, ObokuSharedError } from "@oboku/shared"
import axios from "axios"
import { createHelpers } from "../plugins/helpers"
import { atomicUpdate } from "../couch/dbHelpers"
import { plugins } from "../plugins/plugins"
import { ConfigService } from "@nestjs/config"
import { EnvironmentVariables } from "src/types"

export const sync = async ({
  dataSourceId,
  userName,
  credentials,
  authorization,
  db,
  config,
}: {
  dataSourceId: string
  userName: string
  credentials?: any
  authorization: string
  db: createNano.DocumentScope<unknown>
  config: ConfigService<EnvironmentVariables>
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

    const response = await axios({
      method: `post`,
      url: `${config.get("AWS_API_URI", { infer: true })}/refresh-metadata`,
      data: {
        bookId,
      },
      headers: {
        "content-type": "application/json",
        accept: "application/json",
        "oboku-credentials": JSON.stringify(credentials),
        authorization: authorization,
      },
    })

    if (response.status >= 400) {
      console.error(
        `[syncDataSourceLongProcess] [refreshBookMetadata]`,
        `request error for ${bookId}`,
        response.status,
      )
    } else {
      console.log(
        `[syncDataSourceLongProcess] [refreshBookMetadata]`,
        `request success for ${bookId}`,
        response.status,
      )
    }
  }

  const nameHex = Buffer.from(userName).toString("hex")
  const helpers = createHelpers(dataSourceId, refreshBookMetadata, db)

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

    await syncReport.send(config)
  }
}
