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
  findByIds = vi.fn<(ids: string[]) => void>(),
}: {
  books: { _id: string; links: string[] }[]
  linksById: Record<string, { type: string }>
  findByIds?: ReturnType<typeof vi.fn<(ids: string[]) => void>>
}) =>
  // test double: only the two collections the function reads are provided
  ({
    book: { find: () => ({ exec: async () => books }) },
    link: {
      findByIds: (ids: string[]) => {
        findByIds(ids)

        return {
          exec: async () =>
            new Map(
              ids
                .filter((id) => linksById[id])
                .map((id) => [id, linksById[id]]),
            ),
        }
      },
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

  it("resolves every book's links in a single batched query", async () => {
    downloadsToArray.mockResolvedValue([{ id: "book-a" }, { id: "book-b" }])

    const findByIds = vi.fn<(ids: string[]) => void>()
    const db = makeDb({
      books: [
        { _id: "book-a", links: ["link-a"] },
        { _id: "book-b", links: ["link-b"] },
      ],
      linksById: {
        "link-a": { type: "file" },
        "link-b": { type: "dropbox" },
      },
      findByIds,
    })

    await countLocalOnlyDownloadedBooks(db)

    expect(findByIds).toHaveBeenCalledTimes(1)
    expect(findByIds).toHaveBeenCalledWith(["link-a", "link-b"])
  })
})
