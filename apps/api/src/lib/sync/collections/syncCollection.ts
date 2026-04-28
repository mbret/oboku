import { repairCollectionBooks } from "./repairCollectionBooks"
import type { Context } from "../types"
import { addNewCollection } from "./addNewCollection"
import { updateCollection } from "./updateCollection"
import {
  type DataSourcePlugin,
  SynchronizeAbleDataSource,
} from "src/features/plugins/types"
import { Logger } from "@nestjs/common"
import type { CollectionRefreshQueue } from "../synchronizeFromDataSource"

type Helpers = Parameters<NonNullable<DataSourcePlugin["sync"]>>[1]
type SynchronizeAbleItem = SynchronizeAbleDataSource["items"][number]

const logger = new Logger("sync/registerOrUpdateCollection")

export const syncCollection = async ({
  item,
  helpers,
  ctx,
  collectionRefreshQueue,
}: {
  ctx: Context
  item: SynchronizeAbleItem
  helpers: Helpers
  collectionRefreshQueue: CollectionRefreshQueue
}) => {
  /**
   * Try to get existing collection by same resource id and link data.
   * Prefer the one that uses the current datasource's credentials so metadata
   * refresh can run correctly.
   */
  const { collections } = await ctx.plugin.getCollectionCandidatesForItem(
    item,
    ctx,
  )
  const bestCandidate =
    collections.find((c) => c.isUsingSameProviderCredentials) ?? collections[0]

  if (bestCandidate) {
    logger.log(
      `Found an existing collection for ${bestCandidate._id}. Created at ${bestCandidate.createdAt} and last synced at ${bestCandidate.syncAt}`,
    )

    await updateCollection({
      collection: bestCandidate,
      ctx,
      helpers,
      item,
    })
  }

  let collectionId = bestCandidate?._id

  if (!collectionId) {
    collectionId = await addNewCollection({
      ctx,
      name: item.name,
      linkData: item.linkData,
      linkType: ctx.dataSourceType,
    })
  }

  await repairCollectionBooks({
    collectionId,
    ctx,
  })

  /**
   * Only queue a metadata refresh when the collection uses the same
   * connector/credentials as the current datasource; otherwise record it in the
   * report like we do for books. The actual emission happens at the end of the
   * sync (see `synchronizeFromDataSource`) so that protection-aware logic can
   * read the up-to-date books and tags.
   */
  const usesSameCredentials =
    !bestCandidate || bestCandidate.isUsingSameProviderCredentials
  if (usesSameCredentials) {
    collectionRefreshQueue.add(collectionId)
  } else {
    ctx.syncReport.collectionHasDifferentLink(collectionId)
  }
}
