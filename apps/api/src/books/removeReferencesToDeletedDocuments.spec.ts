import {
  createBookDefaults,
  type BookDocType,
  type CollectionDocType,
  type LibrarySyncDocTypeFor,
  type TagsDocType,
} from "@oboku/shared"
import type { MangoQuery } from "nano"
import { describe, expect, it, vi } from "vitest"
import { removeReferencesToDeletedDocuments } from "./removeReferencesToDeletedDocuments.js"

type StoredDoc =
  | BookDocType
  | CollectionDocType
  | TagsDocType
  | LibrarySyncDocTypeFor<"webdav">

const bookWith = (
  references: Pick<BookDocType, "collections" | "tags" | "links">,
): BookDocType => ({
  ...createBookDefaults(),
  _id: "book-live",
  _rev: "1-a",
  rxdbMeta: { lwt: 0 },
  rx_model: "book",
  ...references,
})

const collectionWith = (books: string[]): CollectionDocType => ({
  _id: "collection-live",
  _rev: "1-a",
  rxdbMeta: { lwt: 0 },
  rx_model: "obokucollection",
  books,
  modifiedAt: null,
  createdAt: "2026-11-01T10:00:00.000Z",
})

const tagWith = (_id: string, books: string[]): TagsDocType => ({
  _id,
  _rev: "1-a",
  rxdbMeta: { lwt: 0 },
  rx_model: "tag",
  name: _id,
  isProtected: false,
  books,
  modifiedAt: null,
  createdAt: "2026-11-01T10:00:00.000Z",
})

const librarySyncWith = (tags: string[]): LibrarySyncDocTypeFor<"webdav"> => ({
  _id: "library-sync",
  _rev: "1-a",
  rxdbMeta: { lwt: 0 },
  rx_model: "datasource",
  type: "webdav",
  createdAt: "2026-11-01T10:00:00.000Z",
  modifiedAt: null,
  lastSyncedAt: null,
  syncStatus: null,
  data_v2: { connectorId: "connector", directory: "books" },
  tags,
})

const createUserDb = ({
  docs,
  liveIdsNotRead = [],
  deletedIds = [],
  conflictingIds = [],
}: {
  docs: StoredDoc[]
  liveIdsNotRead?: string[]
  deletedIds?: string[]
  conflictingIds?: string[]
}) => ({
  find: vi.fn(async function findDocumentsOfModel(query: MangoQuery) {
    return {
      docs: docs.filter((doc) => doc.rx_model === query.selector.rx_model),
      bookmark: "last-page",
    }
  }),
  fetchRevs: vi.fn(async function fetchRevisions({ keys }: { keys: string[] }) {
    return {
      offset: 0,
      total_rows: keys.length,
      rows: keys.map(function toRow(key) {
        if (deletedIds.includes(key)) {
          return { id: key, key, value: { rev: "2-b", deleted: true } }
        }

        if (liveIdsNotRead.includes(key)) {
          return { id: key, key, value: { rev: "1-a" } }
        }

        return { key, error: "not_found" }
      }),
    }
  }),
  bulk: vi.fn(async function writeDocuments({
    docs: written,
  }: {
    docs: StoredDoc[]
  }) {
    return written.map(function toResult(doc) {
      return conflictingIds.includes(doc._id)
        ? {
            id: doc._id,
            error: "conflict",
            reason: "Document update conflict.",
          }
        : { id: doc._id, rev: "2-c", ok: true }
    })
  }),
})

const book = bookWith({
  collections: ["collection-live", "collection-deleted", "collection-unsynced"],
  tags: ["tag-live", "tag-deleted"],
  links: ["link-live", "link-deleted", "link-unsynced"],
})
const collection = collectionWith([
  "book-live",
  "book-deleted",
  "book-unsynced",
])
const tag = tagWith("tag-live", ["book-live", "book-deleted"])
const tagWithoutDeletedBook = tagWith("tag-clean", ["book-live"])
const librarySync = librarySyncWith(["tag-live", "tag-deleted", "tag-unsynced"])
const docsWithDeletedReferences = [
  book,
  collection,
  tag,
  tagWithoutDeletedBook,
  librarySync,
]
const deletedIds = [
  "book-deleted",
  "collection-deleted",
  "tag-deleted",
  "link-deleted",
]

describe("removeReferencesToDeletedDocuments", () => {
  it("removes the ids of deleted documents from every reference, and keeps those of live documents and of documents CouchDB has never seen", async () => {
    const db = createUserDb({
      docs: docsWithDeletedReferences,
      liveIdsNotRead: ["link-live"],
      deletedIds,
    })

    const updatedCount = await removeReferencesToDeletedDocuments(db)

    expect(updatedCount).toBe(4)
    expect(db.bulk).toHaveBeenCalledExactlyOnceWith({
      docs: [
        {
          ...book,
          collections: ["collection-live", "collection-unsynced"],
          tags: ["tag-live"],
          links: ["link-live", "link-unsynced"],
        },
        { ...collection, books: ["book-live", "book-unsynced"] },
        { ...tag, books: ["book-live"] },
        { ...librarySync, tags: ["tag-live", "tag-unsynced"] },
      ],
    })
  })

  it("asks CouchDB only about the ids of documents it did not read", async () => {
    const db = createUserDb({ docs: docsWithDeletedReferences, deletedIds })

    await removeReferencesToDeletedDocuments(db)

    expect(db.fetchRevs).toHaveBeenCalledExactlyOnceWith({
      keys: [
        "collection-deleted",
        "collection-unsynced",
        "tag-deleted",
        "link-live",
        "link-deleted",
        "link-unsynced",
        "book-deleted",
        "book-unsynced",
        "tag-unsynced",
      ],
    })
  })

  it("writes nothing when no reference points to a deleted document", async () => {
    const db = createUserDb({
      docs: docsWithDeletedReferences,
      liveIdsNotRead: ["link-live"],
    })

    const updatedCount = await removeReferencesToDeletedDocuments(db)

    expect(updatedCount).toBe(0)
    expect(db.bulk).not.toHaveBeenCalled()
  })

  it("leaves out of its count a document that changed since it was read", async () => {
    const db = createUserDb({
      docs: docsWithDeletedReferences,
      deletedIds,
      conflictingIds: ["collection-live"],
    })

    const updatedCount = await removeReferencesToDeletedDocuments(db)

    expect(updatedCount).toBe(3)
  })
})
