import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { cleanup, renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { dexieDb } from "../rxdb/dexie"
import { MirrorStoredDownloads } from "./MirrorStoredDownloads"
import {
  booksDownloadStateSignal,
  DownloadState,
  getBookDownloadsState,
  useBookDownloadState,
} from "./states"
import { useDownloadedFilesInfo } from "./useDownloadedFilesInfo"

function storeDownload(bookId: string, content = "book") {
  return dexieDb.downloads.put({
    id: bookId,
    data: new Blob([content]),
    filename: `${bookId}.epub`,
  })
}

function renderTab(onReady = vi.fn()) {
  const queryClient = new QueryClient()

  return renderHook(
    function useRenderedDownloads() {
      return {
        bookA: useBookDownloadState("book-a"),
        bookB: useBookDownloadState("book-b"),
        downloadedFiles: useDownloadedFilesInfo(),
      }
    },
    {
      wrapper: function Wrapper({ children }: { children: ReactNode }) {
        return (
          <QueryClientProvider client={queryClient}>
            <MirrorStoredDownloads onReady={onReady} />
            {children}
          </QueryClientProvider>
        )
      },
    },
  )
}

function markBookBAsDownloadingInThisTab() {
  booksDownloadStateSignal.update({
    "book-b": {
      downloadState: DownloadState.Downloading,
      downloadProgress: 40,
    },
  })
}

describe("MirrorStoredDownloads", () => {
  afterEach(async function clearStoredDownloads() {
    cleanup()
    await dexieDb.downloads.clear()
    booksDownloadStateSignal.update({})
  })

  it("reports ready once, after mirroring the first read", async () => {
    await storeDownload("book-a")
    const onReady = vi.fn(function readBookAStateWhenReady() {
      return getBookDownloadsState({ bookId: "book-a" }).isDownloaded
    })

    const { result } = renderTab(onReady)

    await waitFor(function waitForReady() {
      expect(onReady).toHaveBeenCalled()
    })
    expect(onReady).toHaveNthReturnedWith(1, true)

    await storeDownload("book-b")

    await waitFor(function waitForBookBDownloaded() {
      expect(result.current.bookB?.isDownloaded).toBe(true)
    })
    expect(onReady).toHaveBeenCalledTimes(1)
  })

  it("shows a stored book as downloaded, with its size", async () => {
    const { result } = renderTab()

    expect(result.current.bookA?.isDownloaded).toBe(false)

    await storeDownload("book-a", "12345")

    await waitFor(function waitForBookADownloaded() {
      expect(result.current.bookA?.isDownloaded).toBe(true)
    })
    expect(result.current.bookA).toMatchObject({
      downloadProgress: 100,
      size: 5,
    })
  })

  it("shows a removed book as not downloaded", async () => {
    await storeDownload("book-a")

    const { result } = renderTab()

    await waitFor(function waitForBookADownloaded() {
      expect(result.current.bookA?.isDownloaded).toBe(true)
    })

    await dexieDb.downloads.delete("book-a")

    await waitFor(function waitForBookANotDownloaded() {
      expect(result.current.bookA?.isDownloaded).toBe(false)
    })
  })

  it("keeps a download in progress in this tab when another book is stored", async () => {
    markBookBAsDownloadingInThisTab()

    const { result } = renderTab()

    await storeDownload("book-a")

    await waitFor(function waitForBookADownloaded() {
      expect(result.current.bookA?.isDownloaded).toBe(true)
    })
    expect(result.current.bookB).toMatchObject({
      isDownloading: true,
      downloadProgress: 40,
    })
  })

  it("keeps a download in progress in this tab when another tab stores the same book", async () => {
    markBookBAsDownloadingInThisTab()

    const { result } = renderTab()

    await storeDownload("book-b")
    await storeDownload("book-a")

    await waitFor(function waitForBookADownloaded() {
      expect(result.current.bookA?.isDownloaded).toBe(true)
    })
    expect(result.current.bookB).toMatchObject({
      isDownloading: true,
      downloadProgress: 40,
    })
  })

  it("gives the downloaded files query the stored downloads", async () => {
    const { result } = renderTab()

    await waitFor(function waitForNoDownloadedFiles() {
      expect(result.current.downloadedFiles.data).toEqual([])
    })

    await storeDownload("book-a")

    await waitFor(function waitForBookAInDownloadedFiles() {
      expect(result.current.downloadedFiles.data).toEqual([
        expect.objectContaining({ id: "book-a" }),
      ])
    })

    await dexieDb.downloads.delete("book-a")

    await waitFor(function waitForBookARemovedFromDownloadedFiles() {
      expect(result.current.downloadedFiles.data).toEqual([])
    })
  })
})
