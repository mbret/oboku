import { type CollectionDocType, directives } from "@oboku/shared"
import type { Context } from "src/datasource/sync/types"
import type { SynchronizeAbleDataSource } from "src/plugins/types"
import { Logger } from "@nestjs/common"
import { atomicUpdate } from "src/couch/dbHelpers"

type SynchronizeAbleItem = SynchronizeAbleDataSource["items"][number]

const logger = new Logger("sync/updateCollection")

export const updateCollection = async ({
  collection,
  item,
  ctx,
}: {
  ctx: Context
  collection: CollectionDocType
  item: SynchronizeAbleItem
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

    await atomicUpdate(ctx.db, "obokucollection", collection._id, (old) => {
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
