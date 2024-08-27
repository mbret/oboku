import { LinkDocType, ObokuErrorCode, ObokuSharedError } from "@oboku/shared"
import { createHelpers } from "./helpers"
import { synchronizeFromDataSource } from "../sync/synchronizeFromDataSource"
import createNano from "nano"
import { plugins } from "./plugins"
import { atomicUpdate } from "@libs/couch/dbHelpers"
import { SyncReport } from "@libs/sync/SyncReport"

const urlPlugin = plugins.find(({ type }) => type === `URI`)

export const pluginFacade = {
  getMetadata: async ({
    resourceId,
    linkType,
    resourceData,
    credentials
  }: {
    resourceId: string
    linkType: string
    credentials?: any
    resourceData?: any
  }) => {
    const plugin = plugins.find(({ type }) => type === linkType) || urlPlugin

    if (plugin) {
      return await plugin.getMetadata({
        id: resourceId,
        credentials,
        data: resourceData
      })
    }

    throw new Error(`No dataSource found for action`)
  },
  download: async (link: LinkDocType, credentials?: any) => {
    const plugin = plugins.find(({ type }) => type === link.type) || urlPlugin

    if (plugin && plugin.download) {
      return plugin.download(link, credentials)
    }

    throw new Error(`No dataSource found for action`)
  },
  sync: async ({
    dataSourceId,
    userName,
    credentials,
    refreshBookMetadata,
    authorization,
    db
  }: {
    dataSourceId: string
    userName: string
    credentials?: any
    authorization: string
    refreshBookMetadata: ({ bookId }: { bookId: string }) => Promise<any>
    db: createNano.DocumentScope<unknown>
  }) => {
    console.log(
      `dataSourceFacade started sync for ${dataSourceId} with user ${userName}`
    )

    const syncReport = new SyncReport(dataSourceId, userName)
    const nameHex = Buffer.from(userName).toString("hex")
    const helpers = createHelpers(dataSourceId, refreshBookMetadata, db)

    try {
      const dataSource = await helpers.findOne("datasource", {
        selector: { _id: dataSourceId }
      })

      if (!dataSource) throw new Error("Data source not found")

      if (dataSource.syncStatus !== "fetching") {
        await atomicUpdate(db, "datasource", dataSource._id, (old) => ({
          ...old,
          syncStatus: "fetching" as const
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
        userNameHex: nameHex
      }
      const plugin = plugins.find((plugin) => plugin.type === type)

      if (!plugin?.sync) {
        throw new Error("plugin does not support sync")
      }

      const synchronizeAbleDataSource = await plugin?.sync(ctx, helpers)

      console.log(`Execute sync process with ${plugin?.type} plugin`)

      if (synchronizeAbleDataSource) {
        await synchronizeFromDataSource(synchronizeAbleDataSource, ctx, helpers)
      }

      console.log(`Update datasource with sync success flag`)

      await atomicUpdate(db, "datasource", dataSourceId, (old) => ({
        ...old,
        lastSyncedAt,
        lastSyncErrorCode: null,
        syncStatus: null
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
        syncStatus: null
      }))

      throw e
    } finally {
      syncReport.end()

      await syncReport.send()
    }
  }
}
