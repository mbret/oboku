import { describe, expect, it, vi } from "vitest"
import type { LinkCandidate } from "../../../plugins/types.js"
import { findLinksOfLiveBooks } from "./findLinksOfLiveBooks.js"

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

const createUserDb = () => ({
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
})

describe("findLinksOfLiveBooks", () => {
  it("resolves with the link of a live book, and leaves out a link of a deleted book, of a book CouchDB has never seen, or without a book", async () => {
    const linkOfLiveBook = linkOf("book-live")

    const usableLinks = await findLinksOfLiveBooks(createUserDb(), [
      linkOfLiveBook,
      linkOf("book-deleted"),
      linkOf("book-unsynced"),
      linkOf(null),
    ])

    expect(usableLinks).toEqual([linkOfLiveBook])
  })

  it("asks CouchDB nothing when no link has a book", async () => {
    const db = createUserDb()

    const usableLinks = await findLinksOfLiveBooks(db, [linkOf(null)])

    expect(usableLinks).toEqual([])
    expect(db.fetchRevs).not.toHaveBeenCalled()
  })
})
