import { from, map } from "rxjs"
import type { Database } from "../rxdb"
import type { CollectionDocType } from "@oboku/shared"
import { observeBooks } from "../books/dbHelpers"
import { configuration } from "../config/configuration"

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
  includeProtected,
  isNotInterested,
}: {
  db: Database
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
    includeProtected,
  }).pipe(
    map((books) => {
      const collection: CollectionDocType = {
        _id: configuration.COLLECTION_EMPTY_ID,
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
