import type { Database } from "../rxdb"

export const observeLibrarySyncById = (db: Database, id: string) => {
  return db.datasource.findOne(id).$
}
