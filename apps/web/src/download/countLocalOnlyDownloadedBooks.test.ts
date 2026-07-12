import { describe, expect, it, vi } from "vitest"
import type { Database } from "../rxdb/databases.shared"

const { downloadsToArray } = vi.hoisted(() => ({
  downloadsToArray: vi.fn<() => Promise<{ id: string }[]>>(),
}))

vi.mock("../rxdb/dexie", () => ({
  dexieDb: { downloads: { toArray: downloadsToArray } },
}))

import { countLocalOnlyDownloadedBooks } from "./countLocalOnlyDownloadedBooks"

const makeDb = ({
  books,
  linksById,
}: {
  books: { _id: string; links: string[] }[]
  linksById: Record<string, { type: string }>
}) =>
  // test double: only the two collections the function reads are provided
  ({
    book: { find: () => ({ exec: async () => books }) },
    link: {
      findByIds: (ids: string[]) => ({
        exec: async () =>
          new Map(
            ids.filter((id) => linksById[id]).map((id) => [id, linksById[id]]),
          ),
      }),
    },
  }) as unknown as Database

describe("countLocalOnlyDownloadedBooks", () => {
  it("counts only downloaded books whose link is a device-local file", async () => {
    downloadsToArray.mockResolvedValue([
      { id: "book-local" },
      { id: "book-remote" },
    ])

    const db = makeDb({
      books: [
        { _id: "book-local", links: ["link-local"] },
        { _id: "book-remote", links: ["link-remote"] },
      ],
      linksById: {
        "link-local": { type: "file" },
        "link-remote": { type: "dropbox" },
      },
    })

    expect(await countLocalOnlyDownloadedBooks(db)).toBe(1)
  })

  it("returns 0 when nothing is downloaded", async () => {
    downloadsToArray.mockResolvedValue([])

    const db = makeDb({ books: [], linksById: {} })

    expect(await countLocalOnlyDownloadedBooks(db)).toBe(0)
  })

  it("returns 0 when downloaded books are all re-downloadable", async () => {
    downloadsToArray.mockResolvedValue([{ id: "book-remote" }])

    const db = makeDb({
      books: [{ _id: "book-remote", links: ["link-remote"] }],
      linksById: { "link-remote": { type: "dropbox" } },
    })

    expect(await countLocalOnlyDownloadedBooks(db)).toBe(0)
  })
})
