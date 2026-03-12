import { Logger } from "@nestjs/common"
import {
  CollectionDocType,
  DataSourceType,
  directives,
  LinkDataForProvider,
} from "@oboku/shared"
import type { Context } from "../types"
import { insert } from "src/lib/couch/dbHelpers"

const logger = new Logger("sync/addNewCollection")

export const addNewCollection = async <T extends DataSourceType>({
  name,
  linkResourceId,
  linkData,
  linkType,
  ctx,
}: {
  ctx: Context
  name: string
  linkResourceId: string
  linkData: LinkDataForProvider<T>
  linkType: T
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
  const collectionToAdd: Omit<
    CollectionDocType<T>,
    "_id" | "_rev" | "rx_model"
  > = {
    linkResourceId,
    linkType,
    linkData,
    books: [],
    createdAt: new Date().toISOString(),
    modifiedAt: null,
    syncAt: new Date().toISOString(),
    type: directiveValues.series ? ("series" as const) : ("shelve" as const),
    rxdbMeta: {
      lwt: Date.now(),
    },
    metadata: [linkMetadata],
  }

  const created = await insert(ctx.db, "obokucollection", collectionToAdd)

  ctx.syncReport.addCollection({ _id: created.id, ...collectionToAdd })

  return created.id
}
