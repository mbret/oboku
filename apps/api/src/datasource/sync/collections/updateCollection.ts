import { type CollectionDocType, directives } from "@oboku/shared"
import type { Context } from "../types.js"
import type { SynchronizeAbleItem } from "../../../plugins/types.js"
import { Logger } from "@nestjs/common"
import { atomicUpdate } from "../../../couch/dbHelpers.js"
import { isLinkDataOutdated } from "../linkData.js"

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

  if (isLinkDataOutdated(collection.linkData, item.linkData)) {
    await atomicUpdate(ctx.db, "obokucollection", collection._id, (old) => ({
      ...old,
      linkData: { ...old.linkData, ...item.linkData },
    }))

    ctx.syncReport.updateCollection(collection._id)
  }
}
