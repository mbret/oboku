import { Logger } from "@nestjs/common"
import type {
  DataSourcePlugin,
  SynchronizeAbleDataSource,
} from "src/lib/plugins/types"
import { CollectionDocType, directives } from "@oboku/shared"
import type { Context } from "../types"

type Helpers = Parameters<NonNullable<DataSourcePlugin["sync"]>>[1]
type SynchronizeAbleItem = SynchronizeAbleDataSource["items"][number]

const logger = new Logger("sync/addNewCollection")

export const addNewCollection = async ({
  item: { name, resourceId: linkResourceId, linkData },
  helpers,
  ctx,
}: {
  ctx: Context
  item: SynchronizeAbleItem
  helpers: Helpers
}) => {
  const directiveValues = directives.extractDirectivesFromName(name)

  const linkMetadata = {
    type: "link" as const,
    title: name,
  }

  logger.log(
    `registerOrUpdateCollection ${name} does not exist yet and will be created`,
  )

  /**
   * Otherwise we just create a new collection with this resource id
   * Note that there could be another collection with same name. But since it
   * does not come from the same datasource it should still be treated as different
   */
  const collectionToAdd: Omit<CollectionDocType, "_id" | "_rev" | "rx_model"> =
    {
      linkResourceId,
      linkType: ctx.dataSourceType,
      linkData,
      books: [],
      createdAt: new Date().toISOString(),
      modifiedAt: null,
      syncAt: new Date().toISOString(),
      type: directiveValues.series ? ("series" as const) : ("shelve" as const),
      rxdbMeta: {
        lwt: new Date().getTime(),
      },
      metadata: [linkMetadata],
    }

  const created = await helpers.create("obokucollection", collectionToAdd)

  ctx.syncReport.addCollection({ _id: created.id, ...collectionToAdd })

  return created.id
}
