import { LinkDocType, ObokuErrorCode, ObokuSharedError } from "@oboku/shared"
import { createHelpers } from "./helpers"
import { sync } from "./sync"
import createNano from "nano"
import { plugins } from "./plugins"
import { atomicUpdate } from "@libs/dbHelpers"

const urlPlugin = plugins.find(({ type }) => type === `URI`)

export const dataSourceFacade = {
  getMetadata: async (link: LinkDocType, credentials?: any) => {
    const plugin = plugins.find(({ type }) => type === link.type) || urlPlugin

    if (plugin) {
      return plugin.getMetadata(link, credentials)
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
    db,
    isBookCoverExist
  }: {
    dataSourceId: string
    userName: string
    credentials?: any
    refreshBookMetadata: ({ bookId }: { bookId: string }) => Promise<any>
    isBookCoverExist: ({ coverId }: { coverId: string }) => Promise<boolean>
    db: createNano.DocumentScope<unknown>
  }) => {
    console.log(
      `dataSourceFacade started sync for ${dataSourceId} with user ${userName}`
    )

    const nameHex = Buffer.from(userName).toString("hex")
    const helpers = createHelpers(
      dataSourceId,
      refreshBookMetadata,
      db,
      isBookCoverExist,
      nameHex
    )

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
      const ctx = { dataSourceId, userName, credentials, dataSourceType: type }
      const plugin = plugins.find((plugin) => plugin.type === type)

      if (!plugin?.sync) {
        throw new Error("plugin does not support sync")
      }

      const synchronizeAbleDataSource = await plugin?.sync(ctx, helpers)

      console.log(`Execute sync process with ${plugin?.type} plugin`)

      if (synchronizeAbleDataSource) {
        await sync(synchronizeAbleDataSource, ctx, helpers)
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
    }
  }
}
