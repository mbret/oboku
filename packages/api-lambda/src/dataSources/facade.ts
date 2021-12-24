import { Errors, LinkDocType, ObokuSharedError } from "@oboku/shared/src"
import { createHelpers } from "./helpers"
import { sync } from "./sync"
import createNano from 'nano'
import { atomicUpdate } from "../db/helpers"
import { plugins } from "./plugins"

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

    if (plugin) {
      return plugin.download(link, credentials)
    }

    throw new Error(`No dataSource found for action`)
  },
  sync: async ({ dataSourceId, userEmail, credentials, refreshBookMetadata, db, isBookCoverExist }: {
    dataSourceId: string,
    userEmail: string,
    credentials?: any,
    refreshBookMetadata: ({ bookId }: { bookId: string }) => Promise<any>,
    isBookCoverExist: ({ coverId }: { coverId: string }) => Promise<boolean>,
    db: createNano.DocumentScope<unknown>
  }) => {
    console.log(`dataSourceFacade started sync for ${dataSourceId} with user ${userEmail}`)

    const userId = Buffer.from(userEmail).toString('hex')
    const helpers = createHelpers(dataSourceId, refreshBookMetadata, db, isBookCoverExist, userId)

    try {
      const dataSource = await helpers.findOne('datasource', { selector: { _id: dataSourceId } })

      if (!dataSource) throw new Error('Data source not found')

      if (dataSource.syncStatus !== 'fetching') {
        await atomicUpdate(db, 'datasource', dataSource._id, old => ({
          ...old,
          syncStatus: 'fetching' as const,
        }))
      }

      const { type } = dataSource

      // we create the date now on purpose so that if something change on the datasource
      // during the process (which can take time), user will not be misled to believe its
      // latest changes have been synced
      const lastSyncedAt = new Date().getTime()
      const ctx = { dataSourceId, userEmail, credentials, dataSourceType: type }
      const plugin = plugins.find(({ type }) => type === type)

      const synchronizeAbleDataSource = await plugin?.sync(ctx, helpers)

      if (synchronizeAbleDataSource) {
        await sync(synchronizeAbleDataSource, ctx, helpers)
      }

      await atomicUpdate(db, 'datasource', dataSourceId, old => ({
        ...old,
        lastSyncedAt,
        lastSyncErrorCode: null,
        syncStatus: null,
      }))

      console.log(`dataSourcesSync for ${dataSourceId} completed successfully`)
    } catch (e) {
      let lastSyncErrorCode = Errors.ERROR_DATASOURCE_UNKNOWN
      if (e instanceof ObokuSharedError) {
        lastSyncErrorCode = e.code
      }

      await atomicUpdate(db, 'datasource', dataSourceId, old => ({
        ...old,
        lastSyncErrorCode,
        syncStatus: null,
      }))

      throw e
    }
  }
}