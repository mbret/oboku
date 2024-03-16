import { Database } from "../rxdb"

export const getDataSourceById = (db: Database, id: string) => {
  return db.datasource.findOne(id).exec()
}
