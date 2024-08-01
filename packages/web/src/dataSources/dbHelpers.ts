import { Database } from "../rxdb"

export const observeDataSourceById = (db: Database, id: string) => {
  return db.datasource.findOne(id).$
}
