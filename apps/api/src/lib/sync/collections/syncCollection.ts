import { triggerMetadataRefresh } from "./triggerMetadataRefresh"
import { repairCollectionBooks } from "./repairCollectionBooks"
import type { Context } from "../types"
import { addNewCollection } from "./addNewCollection"
import { updateCollection } from "./updateCollection"
import { ConfigService } from "@nestjs/config"
import { EnvironmentVariables } from "src/types"
import {
  DataSourcePlugin,
  SynchronizeAbleDataSource,
} from "src/lib/plugins/types"
import { Logger } from "@nestjs/common"

type Helpers = Parameters<NonNullable<DataSourcePlugin["sync"]>>[1]
type SynchronizeAbleItem = SynchronizeAbleDataSource["items"][number]

const logger = new Logger("sync/registerOrUpdateCollection")

export const syncCollection = async ({
  item,
  helpers,
  ctx,
  config,
}: {
  ctx: Context
  item: SynchronizeAbleItem
  helpers: Helpers
  config: ConfigService<EnvironmentVariables>
}) => {
  const { resourceId: linkResourceId } = item

  /**
   * Try to get existing collection by same resource id
   * If there is one and the name is different we update it
   */
  const collectionFromResourceId = await helpers.findOne("obokucollection", {
    selector: { linkResourceId },
  })

  if (collectionFromResourceId) {
    logger.log(
      `Found an existing collection for ${collectionFromResourceId._id}. Created at ${collectionFromResourceId.createdAt} and last synced at ${collectionFromResourceId.syncAt}`,
    )

    await updateCollection({
      collection: collectionFromResourceId,
      ctx,
      helpers,
      item,
    })
  }

  const collectionId =
    collectionFromResourceId?._id ??
    (await addNewCollection({
      ctx,
      helpers,
      item,
    }))

  await repairCollectionBooks({
    collectionId,
    ctx,
  })

  triggerMetadataRefresh({
    collectionId,
    ctx,
    config,
  })
}
