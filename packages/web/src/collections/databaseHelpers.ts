import { CollectionDocType, directives } from "@oboku/shared"
import { useLocalSettings } from "../settings/states"
import { useForeverQuery } from "reactjrx"
import { latestDatabase$ } from "../rxdb/useCreateDatabase"
import { map, switchMap } from "rxjs"
import { keyBy } from "lodash"
import { Database } from "../rxdb"
import { useVisibleBookIds } from "../books/states"

export type Collection = CollectionDocType

export const getCollectionsByIds = async (database: Database) => {
  const result = await database.collections.obokucollection.find({}).exec()

  return keyBy(
    result.map((item) => item.toJSON()),
    "_id"
  )
}
