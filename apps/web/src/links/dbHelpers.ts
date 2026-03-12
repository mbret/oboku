import type { Database } from "../rxdb"

export const observeLinkById = (database: Database, id: string) => {
  return database.link.findOne({
    selector: {
      _id: id,
    },
  }).$
}
