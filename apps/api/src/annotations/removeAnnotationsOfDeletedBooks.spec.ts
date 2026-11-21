import type { AnnotationDocType } from "@oboku/shared"
import { describe, expect, it, vi } from "vitest"
import { removeAnnotationsOfDeletedBooks } from "./removeAnnotationsOfDeletedBooks.js"

const LIVE_BOOK_ID = "book-live"
const DELETED_BOOK_ID = "book-deleted"
const UNSYNCED_BOOK_ID = "book-waiting-to-sync-on-a-device"

const annotationOf = (bookId: string): AnnotationDocType => ({
  _id: `annotation-of-${bookId}`,
  _rev: "1-a",
  rxdbMeta: { lwt: 0 },
  rx_model: "annotation",
  bookId,
  cfi: "epubcfi(/6/4!/4/2/1:0)",
  createdAt: "2026-11-01T10:00:00.000Z",
  modifiedAt: null,
})

const createUserDb = (annotations: AnnotationDocType[]) => ({
  find: vi.fn(async function findAnnotations() {
    return { docs: annotations, bookmark: "last-page" }
  }),
  fetch: vi.fn(async function fetchBooks() {
    return {
      offset: 0,
      total_rows: 3,
      rows: [
        { id: LIVE_BOOK_ID, key: LIVE_BOOK_ID, value: { rev: "1-a" } },
        {
          id: DELETED_BOOK_ID,
          key: DELETED_BOOK_ID,
          value: { rev: "2-b", deleted: true },
        },
        { key: UNSYNCED_BOOK_ID, error: "not_found" },
      ],
    }
  }),
  bulk: vi.fn(async function writeDocuments() {
    return [{ id: `annotation-of-${DELETED_BOOK_ID}`, rev: "2-c", ok: true }]
  }),
})

describe("removeAnnotationsOfDeletedBooks", () => {
  it("removes the annotations of a deleted book, and keeps those of a live book or of a book CouchDB has never seen", async () => {
    const annotationOfDeletedBook = annotationOf(DELETED_BOOK_ID)
    const db = createUserDb([
      annotationOf(LIVE_BOOK_ID),
      annotationOfDeletedBook,
      annotationOf(UNSYNCED_BOOK_ID),
    ])

    const removedCount = await removeAnnotationsOfDeletedBooks(db)

    expect(removedCount).toBe(1)
    expect(db.bulk).toHaveBeenCalledExactlyOnceWith({
      docs: [{ ...annotationOfDeletedBook, _deleted: true }],
    })
  })

  it("writes nothing when no annotation's book is deleted", async () => {
    const db = createUserDb([
      annotationOf(LIVE_BOOK_ID),
      annotationOf(UNSYNCED_BOOK_ID),
    ])

    const removedCount = await removeAnnotationsOfDeletedBooks(db)

    expect(removedCount).toBe(0)
    expect(db.bulk).not.toHaveBeenCalled()
  })
})
