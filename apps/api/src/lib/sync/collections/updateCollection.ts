import { type CollectionDocType, directives } from "@oboku/shared"
import type { Context } from "../types"
import {
  DataSourcePlugin,
  SynchronizeAbleDataSource,
} from "src/lib/plugins/types"
import { Logger } from "@nestjs/common"

type Helpers = Parameters<NonNullable<DataSourcePlugin["sync"]>>[1]
type SynchronizeAbleItem = SynchronizeAbleDataSource["items"][number]

const logger = new Logger("sync/updateCollection")

export const updateCollection = async ({
  collection,
  helpers,
  item,
  ctx,
}: {
  ctx: Context
  collection: CollectionDocType
  item: SynchronizeAbleItem
  helpers: Helpers
}) => {
  const { name, modifiedAt } = item
  const directiveValues = directives.extractDirectivesFromName(name)
  const itemModifiedAt = new Date(modifiedAt)

  const lastSyncAt = collection.syncAt ? new Date(collection.syncAt) : undefined

  if (!lastSyncAt || lastSyncAt.getTime() < itemModifiedAt.getTime()) {
    const linkMetadata = {
      type: "link" as const,
      title: name,
    }

    logger.log(
      `${name} modified date ${itemModifiedAt.toISOString()} is older than last synced date or not synced yet`,
    )

    await helpers.atomicUpdate("obokucollection", collection._id, (old) => {
      const listWithoutLink =
        old.metadata?.filter((entry) => entry.type !== "link") ?? []

      return {
        ...old,
        syncAt: new Date().toISOString(),
        linkType: ctx.dataSourceType,
        type: directiveValues.series
          ? ("series" as const)
          : ("shelve" as const),
        metadata: [...listWithoutLink, linkMetadata],
      }
    })

    ctx.syncReport.updateCollection(collection._id)
  }
}
