import { directives } from "@oboku/shared"
import { syncCollection } from "./collections/syncCollection.js"
import { createOrUpdateBook } from "./books/createOrUpdateBook.js"
import type { Context } from "./types.js"
import type {
  SynchronizeAbleLibrarySync,
  SynchronizeAbleItem,
} from "../../plugins/types.js"
import { getOrCreateTagFromName } from "../../couch/dbHelpers.js"
import { Logger } from "@nestjs/common"
import { CoversService } from "../../covers/covers.service.js"

const logger = new Logger("sync")

/**
 * Tracks collection ids whose metadata refresh the caller should emit once
 * the whole sync is done. Emitting after all books exist (and have their tags
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

/**
 * A library sync must not fail while its steps still run: the queue then starts
 * the user's next library sync, and the running steps would create documents at
 * the same time as it.
 */
const waitForAll = async (steps: readonly Promise<unknown>[]) => {
  const outcomes = await Promise.allSettled(steps)

  for (const outcome of outcomes) {
    if (outcome.status === "rejected") throw outcome.reason
  }
}

function isFolder(
  item: SynchronizeAbleLibrarySync | SynchronizeAbleItem,
): item is SynchronizeAbleItem {
  return (item as SynchronizeAbleItem).type === "folder"
}

function isFile(
  item: SynchronizeAbleLibrarySync | SynchronizeAbleItem,
): item is SynchronizeAbleItem {
  return (item as SynchronizeAbleItem).type === "file"
}

/**
 * @returns the ids of the collections whose metadata refresh the caller must
 * emit now that every book is persisted with its tags.
 */
export const synchronizeFromLibrarySync = async (
  synchronizeAble: SynchronizeAbleLibrarySync,
  ctx: Context,
  coversService: CoversService,
): Promise<string[]> => {
  logger.log(
    `Sync run for user ${ctx.userName} with library sync ${ctx.dataSourceId}`,
  )

  for (const item of synchronizeAble.items) {
    await syncTags({
      ctx,
      item,
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
  item: SynchronizeAbleItem
}) => {
  logger.log(`syncTags for item ${item.name}`)

  const tagNames = Array.from(new Set(getItemTags(item)))

  logger.log(`found ${tagNames.length} tags`)

  await waitForAll(
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

  await waitForAll(
    metadataForFolder.tags.map((name) => getOrCreateTagFromName(ctx.db, name)),
  )

  if (isFolder(item) && isCollection) {
    await syncCollection({ ctx, item, collectionRefreshQueue })
  }

  if (isFolder(item)) {
    await waitForAll(
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
