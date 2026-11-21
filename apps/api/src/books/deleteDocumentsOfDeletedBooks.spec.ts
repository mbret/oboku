import type { AnnotationDocType, LinkDocType } from "@oboku/shared"
import { describe, expect, it, vi } from "vitest"
import { deleteDocumentsOfDeletedBooks } from "./deleteDocumentsOfDeletedBooks.js"

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

const linkOf = (book: string | null): LinkDocType => ({
  _id: `link-of-${book ?? "no-book"}`,
  _rev: "1-a",
  rxdbMeta: { lwt: 0 },
  rx_model: "link",
  type: "URI",
  data: { url: "https://example.com/Dune.epub" },
  book,
  modifiedAt: null,
  createdAt: "2026-11-01T10:00:00.000Z",
})

const createUserDb = <Doc>(docs: Doc[]) => ({
  find: vi.fn(async function findDocuments() {
    return { docs, bookmark: "last-page" }
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
  bulk: vi.fn(async function deleteDocuments() {
    return [{ id: "deleted-document", rev: "2-c", ok: true }]
  }),
})

describe("deleteDocumentsOfDeletedBooks", () => {
  it("deletes the annotations of a deleted book, and keeps those of a live book or of a book CouchDB has never seen", async () => {
    const annotationOfDeletedBook = annotationOf(DELETED_BOOK_ID)
    const db = createUserDb([
      annotationOf(LIVE_BOOK_ID),
      annotationOfDeletedBook,
      annotationOf(UNSYNCED_BOOK_ID),
    ])

    const deletedCount = await deleteDocumentsOfDeletedBooks<AnnotationDocType>(
      db,
      {
        model: "annotation",
        getBookId: (annotation) => annotation.bookId,
      },
    )

    expect(deletedCount).toBe(1)
    expect(db.bulk).toHaveBeenCalledExactlyOnceWith({
      docs: [{ ...annotationOfDeletedBook, _deleted: true }],
    })
  })

  it("writes nothing when no document's book is deleted", async () => {
    const db = createUserDb([
      annotationOf(LIVE_BOOK_ID),
      annotationOf(UNSYNCED_BOOK_ID),
    ])

    const deletedCount = await deleteDocumentsOfDeletedBooks<AnnotationDocType>(
      db,
      {
        model: "annotation",
        getBookId: (annotation) => annotation.bookId,
      },
    )

    expect(deletedCount).toBe(0)
    expect(db.bulk).not.toHaveBeenCalled()
  })

  it("deletes the links of a deleted book, and keeps a link without a book or whose book CouchDB has never seen", async () => {
    const linkOfDeletedBook = linkOf(DELETED_BOOK_ID)
    const db = createUserDb([
      linkOf(null),
      linkOfDeletedBook,
      linkOf(UNSYNCED_BOOK_ID),
    ])

    const deletedCount = await deleteDocumentsOfDeletedBooks<LinkDocType>(db, {
      model: "link",
      getBookId: (link) => link.book,
    })

    expect(deletedCount).toBe(1)
    expect(db.fetch).toHaveBeenCalledExactlyOnceWith({
      keys: [DELETED_BOOK_ID, UNSYNCED_BOOK_ID],
    })
    expect(db.bulk).toHaveBeenCalledExactlyOnceWith({
      docs: [{ ...linkOfDeletedBook, _deleted: true }],
    })
  })
})
