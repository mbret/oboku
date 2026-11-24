import { cleanup, renderHook, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { dexieDb } from "../rxdb/dexie"
import { useDownloadedFilesInfo } from "./useDownloadedFilesInfo"

function storeDownload(bookId: string) {
  return dexieDb.downloads.put({
    id: bookId,
    data: new Blob(["book"]),
    filename: `${bookId}.epub`,
  })
}

describe("useDownloadedFilesInfo", () => {
  afterEach(async function clearStoredDownloads() {
    cleanup()
    await dexieDb.downloads.clear()
  })

  it("follows the stored downloads as they are added and removed", async () => {
    const { result } = renderHook(useDownloadedFilesInfo)

    await waitFor(function waitForNoDownloadedFiles() {
      expect(result.current.data).toEqual([])
    })

    await storeDownload("book-a")

    await waitFor(function waitForBookAInDownloadedFiles() {
      expect(result.current.data).toEqual([
        expect.objectContaining({ id: "book-a" }),
      ])
    })

    await dexieDb.downloads.delete("book-a")

    await waitFor(function waitForBookARemovedFromDownloadedFiles() {
      expect(result.current.data).toEqual([])
    })
  })
})
