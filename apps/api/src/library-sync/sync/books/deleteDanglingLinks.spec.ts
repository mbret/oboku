import { describe, expect, it, vi } from "vitest"
import type { LinkCandidate } from "../../../plugins/types.js"
import { SyncReport } from "../SyncReport.js"
import { deleteDanglingLinks } from "./deleteDanglingLinks.js"

const linkOf = (book: string | null): LinkCandidate => ({
  _id: `link-of-${book ?? "no-book"}`,
  _rev: "1-a",
  rxdbMeta: { lwt: 0 },
  rx_model: "link",
  type: "URI",
  data: { url: "https://example.com/Dune.epub" },
  book,
  modifiedAt: null,
  createdAt: "2026-11-01T10:00:00.000Z",
  isUsingSameSourceCredentials: true,
})

const createSyncContext = () => ({
  db: {
    fetchRevs: vi.fn(async function fetchBookRevisions({
      keys,
    }: {
      keys: string[]
    }) {
      return {
        offset: 0,
        total_rows: keys.length,
        rows: [
          { id: "book-live", key: "book-live", value: { rev: "1-a" } },
          {
            id: "book-deleted",
            key: "book-deleted",
            value: { rev: "2-b", deleted: true },
          },
          { key: "book-unsynced", error: "not_found" },
        ].filter((row) => keys.includes(row.key)),
      }
    }),
    bulk: vi.fn(async function deleteLinks({
      docs,
    }: {
      docs: { _id: string }[]
    }) {
      return docs.map((doc) => ({ id: doc._id, rev: "2-c", ok: true }))
    }),
  },
  syncReport: new SyncReport("library-sync", "user"),
})

describe("deleteDanglingLinks", () => {
  it("deletes the link of a deleted book, keeps a link without a book or whose book CouchDB has never seen, and returns the link of a live book", async () => {
    const ctx = createSyncContext()
    const deleteLink = vi.spyOn(ctx.syncReport, "deleteLink")
    const linkOfLiveBook = linkOf("book-live")
    const { isUsingSameSourceCredentials: _, ...linkOfDeletedBook } =
      linkOf("book-deleted")

    const usableLinks = await deleteDanglingLinks(ctx, [
      linkOfLiveBook,
      linkOf("book-deleted"),
      linkOf("book-unsynced"),
      linkOf(null),
    ])

    expect(usableLinks).toEqual([linkOfLiveBook])
    expect(ctx.db.bulk).toHaveBeenCalledExactlyOnceWith({
      docs: [{ ...linkOfDeletedBook, _deleted: true }],
    })
    expect(deleteLink).toHaveBeenCalledExactlyOnceWith(linkOfDeletedBook._id)
  })

  it("deletes nothing when no link's book is deleted", async () => {
    const ctx = createSyncContext()

    const usableLinks = await deleteDanglingLinks(ctx, [
      linkOf("book-live"),
      linkOf("book-unsynced"),
    ])

    expect(usableLinks).toEqual([linkOf("book-live")])
    expect(ctx.db.bulk).not.toHaveBeenCalled()
  })
})
