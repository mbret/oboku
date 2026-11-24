import { render, waitFor } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

const { addDownload } = vi.hoisted(function createDexieMocks() {
  return {
    addDownload:
      vi.fn<
        (download: {
          id: string
          data: Blob
          filename: string
        }) => Promise<string>
      >(),
  }
})

vi.mock("../../rxdb/dexie", function mockDexie() {
  return { dexieDb: { downloads: { add: addDownload } } }
})

import { downloadsBroadcast } from "../downloadsBroadcast"
import { DownloadFlowRequestItem } from "./DownloadFlowRequestItem"

describe("DownloadFlowRequestItem", () => {
  it("tells the other tabs once the downloaded file is stored", async () => {
    const pendingAdd = Promise.withResolvers<string>()
    addDownload.mockReturnValueOnce(pendingAdd.promise)
    const broadcast = vi.spyOn(downloadsBroadcast, "broadcast")
    const resolve = vi.fn()

    render(
      <DownloadFlowRequestItem
        onSettled={vi.fn()}
        request={{
          abortController: new AbortController(),
          bookId: "book-a",
          file: new File(["book"], "book.epub"),
          id: "request-a",
          links: [],
          reject: vi.fn(),
          resolve,
        }}
      />,
    )

    await waitFor(function waitForStore() {
      expect(addDownload).toHaveBeenCalledWith(
        expect.objectContaining({ id: "book-a" }),
      )
    })
    expect(broadcast).not.toHaveBeenCalled()

    pendingAdd.resolve("book-a")

    await waitFor(function waitForDownloadResolved() {
      expect(resolve).toHaveBeenCalled()
    })
    expect(broadcast).toHaveBeenCalledWith("downloads-changed")
  })
})
