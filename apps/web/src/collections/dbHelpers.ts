import { from, map } from "rxjs"
import type { Database } from "../rxdb"
import type { CollectionDocType } from "@oboku/shared"
import { observeBooks } from "../books/dbHelpers"

export const getCollectionById = (database: Database, id: string) => {
  return from(database.collections.obokucollection.findOne(id).exec()).pipe(
    map((result) => result?.toJSON()),
  )
}

export const getCollections = async (database: Database) => {
  const result = await database.collections.obokucollection.find({}).exec()

  return result
}

export const observeEmptyCollection = ({
  db,
  id,
  includeProtected,
  isNotInterested,
}: {
  db: Database
  id: string
  includeProtected: boolean
  isNotInterested?: "with" | "none" | "only" | undefined
}) => {
  return observeBooks({
    db,
    queryObj: {
      selector: {
        collections: {
          $size: 0,
        },
      },
    },
    isNotInterested,
    protected: includeProtected ? "with" : "none",
  }).pipe(
    map((books) => {
      const collection: CollectionDocType = {
        _id: id,
        _rev: ``,
        books: books.map(({ _id }) => _id),
        createdAt: new Date().toISOString(),
        modifiedAt: null,
        rx_model: "obokucollection",
        rxdbMeta: { lwt: 0 },
        metadata: [{ type: "user", title: "Books without collection" }],
      }

      return collection
    }),
  )
}
