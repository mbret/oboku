import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { cleanup, renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

type StoredDownload = { id: string; data: Blob; filename: string }

const { downloadsStore } = vi.hoisted(() => ({
  downloadsStore: new Map<string, StoredDownload>(),
}))

vi.mock("../rxdb/dexie", () => ({
  dexieDb: {
    downloads: {
      toArray: async () => [...downloadsStore.values()],
    },
  },
}))

import { DOWNLOADS_BROADCAST_CHANNEL } from "./downloadsBroadcast"
import {
  booksDownloadStateSignal,
  DownloadState,
  useBookDownloadState,
} from "./states"
import { SyncDownloadsAcrossTabs } from "./SyncDownloadsAcrossTabs"
import { useDownloadedFilesInfo } from "./useDownloadedFilesInfo"

const storeDownload = (bookId: string, content = "book") => {
  downloadsStore.set(bookId, {
    id: bookId,
    data: new Blob([content]),
    filename: `${bookId}.epub`,
  })
}

let otherTab: BroadcastChannel | undefined

const notifyDownloadsChangedFromAnotherTab = () => {
  otherTab ??= new BroadcastChannel(DOWNLOADS_BROADCAST_CHANNEL)
  otherTab.postMessage("downloads-changed")
}

const renderTab = (queryClient = new QueryClient()) =>
  renderHook(
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
            <SyncDownloadsAcrossTabs />
            {children}
          </QueryClientProvider>
        )
      },
    },
  )

describe("SyncDownloadsAcrossTabs", () => {
  afterEach(() => {
    cleanup()
    otherTab?.close()
    otherTab = undefined
    downloadsStore.clear()
    booksDownloadStateSignal.update({})
  })

  it("shows a book downloaded in another tab as downloaded", async () => {
    const { result } = renderTab()

    expect(result.current.bookA?.isDownloaded).toBe(false)

    storeDownload("book-a", "12345")

    notifyDownloadsChangedFromAnotherTab()

    await waitFor(() => {
      expect(result.current.bookA?.isDownloaded).toBe(true)
    })
    expect(result.current.bookA).toMatchObject({
      downloadProgress: 100,
      size: 5,
    })
  })

  it("shows a book removed in another tab as not downloaded", async () => {
    storeDownload("book-a")
    booksDownloadStateSignal.update({
      "book-a": {
        downloadState: DownloadState.Downloaded,
        downloadProgress: 100,
        size: 4,
      },
    })

    const { result } = renderTab()

    expect(result.current.bookA?.isDownloaded).toBe(true)

    downloadsStore.delete("book-a")

    notifyDownloadsChangedFromAnotherTab()

    await waitFor(() => {
      expect(result.current.bookA?.isDownloaded).toBe(false)
    })
  })

  it("keeps a download in progress in this tab when another tab downloads another book", async () => {
    booksDownloadStateSignal.update({
      "book-b": {
        downloadState: DownloadState.Downloading,
        downloadProgress: 40,
      },
    })

    const { result } = renderTab()

    storeDownload("book-a")

    notifyDownloadsChangedFromAnotherTab()

    await waitFor(() => {
      expect(result.current.bookA?.isDownloaded).toBe(true)
    })
    expect(result.current.bookB).toMatchObject({
      isDownloading: true,
      downloadProgress: 40,
    })
  })

  it("keeps a download in progress in this tab when another tab stores the same book", async () => {
    booksDownloadStateSignal.update({
      "book-b": {
        downloadState: DownloadState.Downloading,
        downloadProgress: 40,
      },
    })

    const { result } = renderTab()

    storeDownload("book-a")
    storeDownload("book-b")

    notifyDownloadsChangedFromAnotherTab()

    await waitFor(() => {
      expect(result.current.bookA?.isDownloaded).toBe(true)
    })
    expect(result.current.bookB).toMatchObject({
      isDownloading: true,
      downloadProgress: 40,
    })
  })

  it("refreshes the list of downloaded files after another tab changes it", async () => {
    const { result } = renderTab()

    await waitFor(() => {
      expect(result.current.downloadedFiles.data).toEqual([])
    })

    storeDownload("book-a")

    notifyDownloadsChangedFromAnotherTab()

    await waitFor(() => {
      expect(result.current.downloadedFiles.data).toEqual([
        expect.objectContaining({ id: "book-a" }),
      ])
    })
  })
})
