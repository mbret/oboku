import { Logger } from "@libs/logger"
import {
  DataSourcePlugin,
  SynchronizeAbleDataSource
} from "@libs/plugins/types"
import { directives } from "@oboku/shared"
import axios from "axios"
import { difference } from "lodash"
import { AWS_API_URI } from "src/constants"

type Helpers = Parameters<NonNullable<DataSourcePlugin["sync"]>>[1]
type Context = Parameters<NonNullable<DataSourcePlugin["sync"]>>[0]
type SynchronizeAbleItem = SynchronizeAbleDataSource["items"][number]

const logger = Logger.namespace("sync/registerOrUpdateCollection")

export const registerOrUpdateCollection = async ({
  item: { name, resourceId: linkResourceId, modifiedAt },
  helpers,
  ctx
}: {
  ctx: Context & { authorization: string }
  item: SynchronizeAbleItem
  helpers: Helpers
}) => {
  const directiveValues = directives.extractDirectivesFromName(name)
  const itemModifiedAt = new Date(modifiedAt)

  let collectionId: string | undefined
  /**
   * Try to get existing collection by same resource id
   * If there is one and the name is different we update it
   */
  const collectionFromResourceId = await helpers.findOne("obokucollection", {
    selector: { linkResourceId }
  })

  const linkMetadata = {
    type: "link" as const,
    title: name
  }

  if (collectionFromResourceId) {
    collectionId = collectionFromResourceId._id

    Logger.log(
      `Found an existing collection for ${name}. Created at ${collectionFromResourceId.createdAt} and last synced at ${collectionFromResourceId.syncAt}`
    )

    const lastSyncAt = collectionFromResourceId.syncAt
      ? new Date(collectionFromResourceId.syncAt)
      : undefined

    if (!lastSyncAt || lastSyncAt.getTime() < itemModifiedAt.getTime()) {
      Logger.log(
        `${name} modified date ${itemModifiedAt.toISOString()} is older than last synced date or not synced yet`
      )

      await helpers.atomicUpdate(
        "obokucollection",
        collectionFromResourceId._id,
        (old) => {
          const listWithoutLink =
            old.metadata?.filter((entry) => entry.type !== "link") ?? []

          return {
            ...old,
            syncAt: new Date().toISOString(),
            linkType: ctx.dataSourceType,
            type: directiveValues.series
              ? ("series" as const)
              : ("shelve" as const),
            metadata: [...listWithoutLink, linkMetadata]
          }
        }
      )
    }
  } else {
    logger.log(
      `registerOrUpdateCollection ${name} does not exist yet and will be created`
    )

    /**
     * Otherwise we just create a new collection with this resource id
     * Note that there could be another collection with same name. But since it
     * does not come from the same datasource it should still be treated as different
     */
    const created = await helpers.create("obokucollection", {
      linkResourceId,
      linkType: ctx.dataSourceType,
      books: [],
      createdAt: new Date().toISOString(),
      modifiedAt: null,
      syncAt: new Date().toISOString(),
      type: directiveValues.series ? ("series" as const) : ("shelve" as const),
      rxdbMeta: {
        lwt: new Date().getTime()
      },
      metadata: [linkMetadata]
    })

    collectionId = created.id
  }

  // try to remove book that does not exist anymore if needed
  const collection = await helpers.findOne("obokucollection", {
    selector: { _id: collectionId }
  })

  if (collection) {
    const booksInCollectionExistingInDatabase = await helpers.find("book", {
      selector: { _id: { $in: collection?.books || [] } },
      /**
       * @todo If a collection have more than 999 books we have a problem.
       * We need to find a safer way to detect anomaly.
       */
      limit: 999
    })

    const booksInCollectionAsIds = booksInCollectionExistingInDatabase.map(
      ({ _id }) => _id
    )

    const toRemove = difference(collection.books, booksInCollectionAsIds)

    if (toRemove.length > 0) {
      logger.log(
        `[ANOMALY] registerOrUpdateCollection ${name} contains books that does not exist anymore and they will be removed from it`
      )

      await helpers.atomicUpdate("obokucollection", collection?._id, (old) => ({
        ...old,
        books: old.books.filter((id) => !toRemove.includes(id))
      }))
    }
  }

  axios({
    method: `post`,
    url: `${AWS_API_URI}/refresh-metadata-collection`,
    data: {
      collectionId,
      soft: true
    },
    headers: {
      "content-type": "application/json",
      accept: "application/json",
      "oboku-credentials": JSON.stringify(ctx.credentials),
      authorization: ctx.authorization
    }
  }).catch(logger.error)
}
