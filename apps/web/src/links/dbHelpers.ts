import type { DataSourceDocType, LinkDocType } from "@oboku/shared"
import type { Database } from "../rxdb"

export const getLinksForDataSource = (
  db: Database,
  dataSource: DataSourceDocType,
) => {
  return db.link
    .find({
      selector: {
        dataSourceId: dataSource._id,
      } satisfies Partial<LinkDocType>,
    })
    .exec()
}

export const observeLinkById = (database: Database, id: string) => {
  return database.link.findOne({
    selector: {
      _id: id,
    },
  }).$
}
