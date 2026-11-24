import { describe, expect, it, vi } from "vitest"

const { clear } = vi.hoisted(() => ({ clear: vi.fn(async () => {}) }))

vi.mock("../rxdb/dexie", () => ({ dexieDb: { downloads: { clear } } }))

import { downloadsBroadcast } from "./downloadsBroadcast"
import { purgeAllDownloads } from "./purgeAllDownloads"
import { booksDownloadStateSignal, DownloadState } from "./states"

describe("purgeAllDownloads", () => {
  it("clears the downloads table and resets the in-memory download state", async () => {
    booksDownloadStateSignal.update({
      "book-1": { downloadState: DownloadState.Downloaded, size: 42 },
    })

    await purgeAllDownloads()

    expect(clear).toHaveBeenCalledTimes(1)
    expect(booksDownloadStateSignal.getValue()).toEqual({})
  })

  it("tells the other tabs once the downloads table is cleared", async () => {
    const pendingClear = Promise.withResolvers<void>()
    clear.mockReturnValueOnce(pendingClear.promise)
    const broadcast = vi.spyOn(downloadsBroadcast, "broadcast")

    const purge = purgeAllDownloads()

    expect(broadcast).not.toHaveBeenCalled()

    pendingClear.resolve()
    await purge

    expect(broadcast).toHaveBeenCalledWith("downloads-changed")
  })
})
