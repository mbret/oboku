import { DataSourceDocType } from "@oboku/shared"
import { Database } from "../rxdb"

export const getLinksForDataSource = (
  db: Database,
  dataSource: DataSourceDocType
) => {
  return db.link
    .find({
      selector: {
        dataSourceId: dataSource._id
      }
    })
    .exec()
}
