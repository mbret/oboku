import { repairCollectionBooks } from "./repairCollectionBooks"
import type { Context } from "../types"
import { addNewCollection } from "./addNewCollection"
import { updateCollection } from "./updateCollection"
import {
  type DataSourcePlugin,
  SynchronizeAbleDataSource,
} from "src/features/plugins/types"
import { Logger } from "@nestjs/common"
import { EventEmitter2 } from "@nestjs/event-emitter"
import { CollectionMetadataRefreshEvent, Events } from "src/events"

type Helpers = Parameters<NonNullable<DataSourcePlugin["sync"]>>[1]
type SynchronizeAbleItem = SynchronizeAbleDataSource["items"][number]

const logger = new Logger("sync/registerOrUpdateCollection")

export const syncCollection = async ({
  item,
  helpers,
  ctx,
  eventEmitter,
}: {
  ctx: Context
  item: SynchronizeAbleItem
  helpers: Helpers
  eventEmitter: EventEmitter2
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
   * Only trigger metadata refresh when the collection uses the same
   * connector/credentials as the current datasource; otherwise record it in the
   * report like we do for books.
   */
  const usesSameCredentials =
    !bestCandidate || bestCandidate.isUsingSameProviderCredentials
  if (usesSameCredentials) {
    eventEmitter.emit(
      Events.COLLECTION_METADATA_REFRESH,
      new CollectionMetadataRefreshEvent({
        collectionId,
        providerCredentials: ctx.providerCredentials,
        soft: true,
        email: ctx.email,
      }),
    )
  } else {
    ctx.syncReport.collectionHasDifferentLink(collectionId)
  }
}
