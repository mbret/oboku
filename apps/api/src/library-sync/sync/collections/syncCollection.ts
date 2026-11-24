import { repairCollectionBooks } from "./repairCollectionBooks.js"
import type { Context } from "../types.js"
import { addNewCollection } from "./addNewCollection.js"
import { updateCollection } from "./updateCollection.js"
import type { SynchronizeAbleItem } from "../../../plugins/types.js"
import { Logger } from "@nestjs/common"
import type { CollectionRefreshQueue } from "../synchronizeFromLibrarySync.js"

const logger = new Logger("sync/registerOrUpdateCollection")

export const syncCollection = async ({
  item,
  ctx,
  collectionRefreshQueue,
}: {
  ctx: Context
  item: SynchronizeAbleItem
  collectionRefreshQueue: CollectionRefreshQueue
}) => {
  /**
   * Try to get existing collection by same resource id and link data.
   * Prefer the one that uses the current library sync's credentials so metadata
   * refresh can run correctly.
   */
  const { collections } = await ctx.plugin.getCollectionCandidatesForItem(
    item,
    ctx,
  )
  const bestCandidate =
    collections.find((c) => c.isUsingSameSourceCredentials) ?? collections[0]

  if (bestCandidate) {
    logger.log(
      `Found an existing collection for ${bestCandidate._id}. Created at ${bestCandidate.createdAt} and last synced at ${bestCandidate.syncAt}`,
    )

    await updateCollection({
      collection: bestCandidate,
      ctx,
      item,
    })
  }

  let collectionId = bestCandidate?._id

  if (!collectionId) {
    collectionId = await addNewCollection({
      ctx,
      name: item.name,
      linkData: item.linkData,
      linkType: ctx.sourceType,
    })
  }

  await repairCollectionBooks({
    collectionId,
    ctx,
  })

  /**
   * Only queue a metadata refresh when the collection uses the same
   * connector/credentials as the current library sync; otherwise record it in the
   * report like we do for books. The actual emission happens at the end of the
   * sync (see `LibrarySyncService.sync`) so that protection-aware logic can
   * read the up-to-date books and tags.
   */
  const usesSameCredentials =
    !bestCandidate || bestCandidate.isUsingSameSourceCredentials
  if (usesSameCredentials) {
    collectionRefreshQueue.add(collectionId)
  } else {
    ctx.syncReport.collectionHasDifferentLink(collectionId)
  }
}
