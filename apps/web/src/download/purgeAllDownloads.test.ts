// @vitest-environment jsdom

import { describe, expect, it, vi } from "vitest"

const { clear } = vi.hoisted(() => ({ clear: vi.fn(async () => {}) }))

vi.mock("../rxdb/dexie", () => ({ dexieDb: { downloads: { clear } } }))

import { purgeAllDownloads } from "./purgeAllDownloads"
import { booksDownloadStateSignal, DownloadState } from "./states"

describe("purgeAllDownloads", () => {
  it("clears the downloads table and resets the in-memory download state", async () => {
    booksDownloadStateSignal.setValue({
      "book-1": { downloadState: DownloadState.Downloaded, size: 42 },
    })

    await purgeAllDownloads()

    expect(clear).toHaveBeenCalledTimes(1)
    expect(booksDownloadStateSignal.getValue()).toEqual({})
  })
})
