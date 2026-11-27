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
  liveIds,
  deletedIds,
}: {
  collection: CollectionDocType
  booksListingCollection: BookDocType[]
  liveIds: string[]
  deletedIds: string[]
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
      fetchRevs: async function fetchRevisions({ keys }: { keys: string[] }) {
        return {
          offset: 0,
          total_rows: keys.length,
          rows: keys.map(function toRow(key) {
            if (deletedIds.includes(key)) {
              return { id: key, key, value: { rev: "2-b", deleted: true } }
            }

            if (liveIds.includes(key)) {
              return { id: key, key, value: { rev: "1-a" } }
            }

            return { key, error: "not_found" }
          }),
        }
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
  it("removes a book CouchDB holds as deleted, keeps a book CouchDB has never seen, and adds a book that lists the collection", async () => {
    const ctx = createSyncContext({
      collection: collectionWith([
        "book-live",
        "book-deleted",
        "book-unsynced",
      ]),
      booksListingCollection: [
        bookListingCollection("book-live"),
        bookListingCollection("book-not-listed"),
      ],
      liveIds: ["book-live"],
      deletedIds: ["book-deleted"],
    })
    const removeBooksFromCollection = vi.spyOn(
      ctx.syncReport,
      "removeBooksFromCollection",
    )

    await repairCollectionBooks({ ctx, collectionId: "collection" })

    expect(ctx.insert).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({
        books: ["book-not-listed", "book-live", "book-unsynced"],
      }),
    )
    expect(removeBooksFromCollection).toHaveBeenCalledExactlyOnceWith(
      expect.objectContaining({ books: [{ _id: "book-deleted" }] }),
    )
  })

  it("writes nothing when the collection lists no deleted book and misses no book", async () => {
    const ctx = createSyncContext({
      collection: collectionWith(["book-live", "book-unsynced"]),
      booksListingCollection: [bookListingCollection("book-live")],
      liveIds: ["book-live"],
      deletedIds: [],
    })

    await repairCollectionBooks({ ctx, collectionId: "collection" })

    expect(ctx.insert).not.toHaveBeenCalled()
  })
})
