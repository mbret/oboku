import { combineLatest, distinctUntilChanged, from, map } from "rxjs"
import type { Database } from "../rxdb"
import { type CollectionDocType, isShallowEqual } from "@oboku/shared"
import { observeBooks } from "../books/dbHelpers"

export const getCollectionById = (database: Database, id: string) => {
  return from(database.collections.obokucollection.findOne(id).exec()).pipe(
    map((result) => result?.toJSON()),
  )
}

/**
 * The virtual collection of the books in no collection this device holds. A
 * book whose collection ids all point to deleted collections, or to
 * collections the device has not received yet, is one of them.
 */
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
  const books$ = observeBooks({
    db,
    isNotInterested,
    protected: includeProtected ? "with" : "none",
  })
  const heldCollectionIds$ = db.obokucollection.find().$.pipe(
    map(function toHeldCollectionIds(collections) {
      return new Set(collections.map(({ _id }) => _id))
    }),
  )

  return combineLatest([books$, heldCollectionIds$]).pipe(
    map(function toIdsOfBooksInNoHeldCollection([books, heldCollectionIds]) {
      return books
        .filter(function isInNoHeldCollection(book) {
          return !book.collections.some((collectionId) =>
            heldCollectionIds.has(collectionId),
          )
        })
        .map(({ _id }) => _id)
    }),
    distinctUntilChanged(isShallowEqual),
    map(function toEmptyCollection(bookIds): CollectionDocType {
      return {
        _id: id,
        _rev: ``,
        books: bookIds,
        createdAt: new Date().toISOString(),
        modifiedAt: null,
        rx_model: "obokucollection",
        rxdbMeta: { lwt: 0 },
        metadata: [{ type: "user", title: "Books without collection" }],
      }
    }),
  )
}
