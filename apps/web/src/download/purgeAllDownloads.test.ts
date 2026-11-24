import { afterEach, describe, expect, it } from "vitest"
import { dexieDb } from "../rxdb/dexie"
import { purgeAllDownloads } from "./purgeAllDownloads"

describe("purgeAllDownloads", () => {
  afterEach(async function clearStoredDownloads() {
    await dexieDb.downloads.clear()
  })

  it("removes every stored download", async () => {
    await dexieDb.downloads.bulkPut([
      { id: "book-a", data: new Blob(["a"]), filename: "book-a.epub" },
      { id: "book-b", data: new Blob(["b"]), filename: "book-b.epub" },
    ])

    await purgeAllDownloads()

    expect(await dexieDb.downloads.count()).toBe(0)
  })
})
