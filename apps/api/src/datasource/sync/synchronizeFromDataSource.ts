import { directives } from "@oboku/shared"
import { syncCollection } from "src/datasource/sync/collections/syncCollection"
import { createOrUpdateBook } from "src/datasource/sync/books/createOrUpdateBook"
import type { Context } from "./types"
import type { SynchronizeAbleDataSource } from "src/plugins/types"
import { getOrCreateTagFromName } from "src/couch/dbHelpers"
import { Logger } from "@nestjs/common"
import { CoversService } from "src/covers/covers.service"

const logger = new Logger("sync")

type SynchronizeAbleItem = SynchronizeAbleDataSource["items"][number]

/**
 * Tracks collection ids whose metadata refresh the caller should emit once the
 * whole sync is done. Emitting after all books exist (and have their tags
 * attached) is what allows protection-aware logic in
 * `processRefreshMetadata` to compute `isCollectionProtected` against the
 * up-to-date data.
 */
export type CollectionRefreshQueue = {
  add: (collectionId: string) => void
  flush: () => string[]
}

const createCollectionRefreshQueue = (): CollectionRefreshQueue => {
  const ids = new Set<string>()
  return {
    add: (id) => ids.add(id),
    flush: () => Array.from(ids),
  }
}

function isFolder(
  item: SynchronizeAbleDataSource | SynchronizeAbleItem,
): item is SynchronizeAbleItem {
  return (item as SynchronizeAbleItem).type === "folder"
}

function isFile(
  item: SynchronizeAbleDataSource | SynchronizeAbleItem,
): item is SynchronizeAbleItem {
  return (item as SynchronizeAbleItem).type === "file"
}

/**
 * @returns the ids of the collections whose metadata refresh the caller must
 * emit now that every book is persisted with its tags.
 */
export const synchronizeFromDataSource = async (
  synchronizeAble: SynchronizeAbleDataSource,
  ctx: Context,
  coversService: CoversService,
): Promise<string[]> => {
  logger.log(
    `dataSourcesSync run for user ${ctx.userName} with dataSource ${ctx.dataSourceId}`,
  )

  for (const item of synchronizeAble.items) {
    await syncTags({
      ctx,
      item,
      hasCollectionAsParent: false,
      parents: [],
    })
  }

  /**
   * Order matters for protection checks: tags → books → collections.
   * - Tags were created above so they're ready when books reference them.
   * - syncItem creates/updates collections (no metadata refresh) and books
   *   (with their tags), so books are tagged before any collection refresh
   *   reads them.
   * - Collection metadata refreshes are queued and returned to the caller so
   *   they are only emitted once all books are persisted with their tags and
   *   `isCollectionProtected` sees the true picture.
   */
  const collectionRefreshQueue = createCollectionRefreshQueue()

  for (const item of synchronizeAble.items) {
    await syncItem({
      ctx,
      item,
      hasCollectionAsParent: false,
      parents: [],
      coversService,
      collectionRefreshQueue,
    })
  }

  return collectionRefreshQueue.flush()
}

const getItemTags = (item: SynchronizeAbleItem): string[] => {
  const metadataForFolder = directives.extractDirectivesFromName(item.name)

  const subTagsAsMap = (item.items || []).map((subItem) => {
    return getItemTags(subItem)
  })

  const subTags = subTagsAsMap.reduce((acc, tags) => [...acc, ...tags], [])

  return [...metadataForFolder.tags, ...subTags]
}

/**
 * We first go through all folders and items and create the tags. This way we avoid concurrent tags creation and we can later
 * easily retrieve tags ids.
 */
const syncTags = async ({
  item,
  ctx,
}: {
  ctx: Context
  hasCollectionAsParent: boolean
  item: SynchronizeAbleItem
  parents: SynchronizeAbleItem[]
}) => {
  logger.log(`syncTags for item ${item.name}`)

  const tagNames = Array.from(new Set(getItemTags(item)))

  logger.log(`found ${tagNames.length} tags`)

  await Promise.all(
    tagNames.map(async (tag) => {
      const { created, id } = await getOrCreateTagFromName(ctx.db, tag)

      if (created) {
        logger.log(`syncTags ${tag} created with id ${id}`)

        ctx.syncReport.addTag({ _id: id, name: tag })
      }
    }),
  )
}

const syncItem = async ({
  ctx,
  hasCollectionAsParent,
  item,
  parents,
  coversService,
  collectionRefreshQueue,
}: {
  ctx: Context
  hasCollectionAsParent: boolean
  item: SynchronizeAbleItem
  parents: SynchronizeAbleItem[]
  coversService: CoversService
  collectionRefreshQueue: CollectionRefreshQueue
}) => {
  const metadataForFolder = directives.extractDirectivesFromName(item.name)
  logger.log(`syncItem ${item.name}: metadata `)

  /**
   * If a folder:
   * - does not have parent collection
   * - or is not forbidden to be from directives
   * then it is a collection
   */
  const isCollection =
    isFolder(item) &&
    !hasCollectionAsParent &&
    !metadataForFolder.isNotACollection

  if (metadataForFolder.isIgnored) {
    logger.log(`syncItem ${item.name}: ignored!`)
    return
  }

  await Promise.all(
    metadataForFolder.tags.map((name) => getOrCreateTagFromName(ctx.db, name)),
  )

  if (isFolder(item) && isCollection) {
    await syncCollection({ ctx, item, collectionRefreshQueue })
  }

  if (isFolder(item)) {
    await Promise.all(
      (item.items || []).map(async (subItem) => {
        if (isFile(subItem)) {
          await createOrUpdateBook({
            ctx,
            item: subItem,
            parents: [...parents, item],
            coversService,
          })
        } else if (isFolder(subItem)) {
          await syncItem({
            ctx,
            hasCollectionAsParent: isCollection || hasCollectionAsParent,
            item: subItem,
            parents: [...parents, item],
            coversService,
            collectionRefreshQueue,
          })
        }
      }),
    )
  }

  if (isFile(item)) {
    await createOrUpdateBook({
      ctx,
      item,
      parents: [...parents, item],
      coversService,
    })
  }

  logger.log(
    `syncItem ${item.name}: with items ${item.items?.length || 0} items, done`,
  )
}
