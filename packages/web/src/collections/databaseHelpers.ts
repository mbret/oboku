import { CollectionDocType } from "@oboku/shared"
import { keyBy } from "lodash"
import { Database } from "../rxdb"
import { Observable, ObservedValueOf, from, map, switchMap } from "rxjs"

export type Collection = CollectionDocType

export const getCollectionsByIds = async (database: Database) => {
  const result = await database.collections.obokucollection.find({}).exec()

  return keyBy(
    result.map((item) => item.toJSON()),
    "_id"
  )
}

export const getCollectionById = (database: Database, id: string) => {
  return from(database.collections.obokucollection.findOne(id).exec()).pipe(
    map((result) => result?.toJSON())
  )
}

type CollectionById = ObservedValueOf<ReturnType<typeof getCollectionById>>

export const withLatestCollectionById =
  (database: Database, id: string) =>
  <T>(stream: Observable<T>) => {
    return stream.pipe(
      switchMap((value) =>
        getCollectionById(database, id).pipe(
          map((res) => [value, res] as [T, CollectionById])
        )
      )
    )
  }
