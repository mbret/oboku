import {
  createBookDefaults,
  type BookDocType,
  type CollectionDocType,
} from "@oboku/shared"
import type createNano from "nano"
import { describe, expect, it, vi } from "vitest"
import { SyncReport } from "../SyncReport.js"
import { repairCollectionBooks } from "./repairCollectionBooks.js"

const bookListingCollection = (_id: string): BookDocType => ({
  ...createBookDefaults(),
  _id,
  _rev: "1-a",
  rxdbMeta: { lwt: 0 },
  rx_model: "book",
  collections: ["collection"],
})

const collectionWith = (books: string[]): CollectionDocType => ({
  _id: "collection",
  _rev: "1-a",
  rxdbMeta: { lwt: 0 },
  rx_model: "obokucollection",
  books,
  modifiedAt: null,
  createdAt: "2026-11-01T10:00:00.000Z",
})

const createSyncContext = ({
  collection,
  booksListingCollection,
}: {
  collection: CollectionDocType
  booksListingCollection: BookDocType[]
}) => {
  const insert = vi.fn(async function writeCollection(doc: { _id: string }) {
    return { ok: true, id: doc._id, rev: "2-c" }
  })

  return {
    db: {
      find: async function findDocumentsOfModel(query: createNano.MangoQuery) {
        const docs =
          query.selector.rx_model === "obokucollection"
            ? [collection]
            : booksListingCollection

        return { docs, bookmark: "last-page" }
      },
      get: async function readCollection() {
        return structuredClone(collection)
      },
      insert,
    },
    insert,
    syncReport: new SyncReport("library-sync", "user"),
  }
}

describe("repairCollectionBooks", () => {
  it("adds a book that lists the collection, and keeps every id the collection lists", async () => {
    const ctx = createSyncContext({
      collection: collectionWith(["book-live", "book-deleted"]),
      booksListingCollection: [
        bookListingCollection("book-live"),
        bookListingCollection("book-not-listed"),
      ],
    })
    const addBooksToCollection = vi.spyOn(
      ctx.syncReport,
      "addBooksToCollection",
    )

    await repairCollectionBooks({ ctx, collectionId: "collection" })

    expect(ctx.insert).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        books: ["book-not-listed", "book-live", "book-deleted"],
      }),
    )
    expect(addBooksToCollection).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ books: [{ _id: "book-not-listed" }] }),
    )
  })

  it("writes nothing when the collection lists every book that lists it", async () => {
    const ctx = createSyncContext({
      collection: collectionWith(["book-live", "book-deleted"]),
      booksListingCollection: [bookListingCollection("book-live")],
    })

    await repairCollectionBooks({ ctx, collectionId: "collection" })

    expect(ctx.insert).not.toHaveBeenCalled()
  })
})
