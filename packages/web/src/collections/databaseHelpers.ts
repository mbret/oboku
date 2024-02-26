import { CollectionDocType } from "@oboku/shared"
import { keyBy } from "lodash"
import { Database } from "../rxdb"

export type Collection = CollectionDocType

export const getCollectionsByIds = async (database: Database) => {
  const result = await database.collections.obokucollection.find({}).exec()

  return keyBy(
    result.map((item) => item.toJSON()),
    "_id"
  )
}
