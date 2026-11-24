import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, cleanup, renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { dexieDb } from "../rxdb/dexie"
import { findPendingBookDownload } from "./downloadBookMutation"
import { PluginDownloadFlowHost } from "./flow/PluginDownloadFlowHost"
import {
  DownloadState,
  getBookDownloadsState,
  useBookDownloadState,
} from "./states"
import { useDownloadBook } from "./useDownloadBook"
import { useStoredDownloads } from "./useStoredDownloads"

function storeDownload(bookId: string, content = "book") {
  return dexieDb.downloads.put({
    id: bookId,
    data: new Blob([content]),
    filename: `${bookId}.epub`,
  })
}

function renderBookA({
  queryClient = new QueryClient(),
  withDownloadFlow = false,
} = {}) {
  return renderHook(
    function useRenderedBookA() {
      return {
        bookA: useBookDownloadState("book-a"),
        downloadBook: useDownloadBook(),
        storedDownloads: useStoredDownloads(),
      }
    },
    {
      wrapper: function Wrapper({ children }: { children: ReactNode }) {
        return (
          <QueryClientProvider client={queryClient}>
            {withDownloadFlow && <PluginDownloadFlowHost />}
            {children}
          </QueryClientProvider>
        )
      },
    },
  )
}

describe("download state", () => {
  afterEach(async function clearStoredDownloads() {
    cleanup()
    await dexieDb.downloads.clear()
  })

  it("reads a stored book as downloaded, with its size", async () => {
    const { result } = renderBookA()

    await storeDownload("book-a", "12345")

    await waitFor(function waitForBookADownloaded() {
      expect(result.current.bookA?.isDownloaded).toBe(true)
    })
    expect(result.current.bookA).toMatchObject({
      downloadState: DownloadState.Downloaded,
      downloadProgress: 100,
      size: 5,
    })
  })

  it("reads a removed book as not downloaded", async () => {
    await storeDownload("book-a")

    const { result } = renderBookA()

    await waitFor(function waitForBookADownloaded() {
      expect(result.current.bookA?.isDownloaded).toBe(true)
    })

    await dexieDb.downloads.delete("book-a")

    await waitFor(function waitForBookANotDownloaded() {
      expect(result.current.bookA?.downloadState).toBe(DownloadState.None)
    })
  })

  it("reads a pending download as downloading, with the progress of its signal", async () => {
    const queryClient = new QueryClient()
    const { result } = renderBookA({ queryClient })

    act(function startDownload() {
      result.current.downloadBook.mutate({ _id: "book-a", links: [] })
    })

    await waitFor(function waitForBookADownloading() {
      expect(result.current.bookA?.isDownloading).toBe(true)
    })
    expect(result.current.bookA?.downloadProgress).toBe(0)

    act(function reportProgress() {
      findPendingBookDownload(queryClient, "book-a")?.progress.update(40)
    })

    await waitFor(function waitForProgress() {
      expect(result.current.bookA?.downloadProgress).toBe(40)
    })
  })

  it("reads a download that ends as downloaded, never as not downloaded in between", async () => {
    const queryClient = new QueryClient()
    const recordStateWhenDownloadEnds =
      vi.fn<(downloadState: DownloadState) => void>()
    const stopRecording = queryClient
      .getMutationCache()
      .subscribe(function recordStateOnSuccess(event) {
        const isDownloadEnding =
          event.type === "updated" && event.action.type === "success"

        if (isDownloadEnding) {
          recordStateWhenDownloadEnds(
            getBookDownloadsState({ bookId: "book-a", queryClient })
              .downloadState,
          )
        }
      })
    const { result } = renderBookA({ queryClient, withDownloadFlow: true })

    await waitFor(function waitForStoredDownloadsRead() {
      expect(result.current.storedDownloads.data).toEqual([])
    })

    act(function startDownload() {
      result.current.downloadBook.mutate({
        _id: "book-a",
        links: [],
        file: new File(["book"], "book-a.epub"),
      })
    })

    await waitFor(function waitForDownloadSettled() {
      expect(result.current.downloadBook.isSuccess).toBe(true)
    })
    stopRecording()

    expect(recordStateWhenDownloadEnds).toHaveBeenCalledExactlyOnceWith(
      DownloadState.Downloaded,
    )
    expect(result.current.bookA?.downloadState).toBe(DownloadState.Downloaded)
  })

  it("answers synchronously from the stored downloads and the pending downloads", async () => {
    await storeDownload("book-a", "12345")
    const queryClient = new QueryClient()
    const { result } = renderBookA({ queryClient })

    await waitFor(function waitForBookADownloaded() {
      expect(result.current.bookA?.isDownloaded).toBe(true)
    })

    act(function startDownloadOfBookB() {
      result.current.downloadBook.mutate({ _id: "book-b", links: [] })
    })

    await waitFor(function waitForBookBPending() {
      expect(findPendingBookDownload(queryClient, "book-b")).toBeDefined()
    })

    findPendingBookDownload(queryClient, "book-b")?.progress.update(40)

    expect(getBookDownloadsState({ bookId: "book-b", queryClient })).toEqual({
      downloadState: DownloadState.Downloading,
      downloadProgress: 40,
      size: undefined,
      isDownloaded: false,
      isDownloading: true,
    })
    expect(getBookDownloadsState({ bookId: "book-a", queryClient })).toEqual({
      downloadState: DownloadState.Downloaded,
      downloadProgress: 100,
      size: 5,
      isDownloaded: true,
      isDownloading: false,
    })
    expect(getBookDownloadsState({ bookId: "book-c", queryClient })).toEqual({
      downloadState: DownloadState.None,
      downloadProgress: 0,
      size: undefined,
      isDownloaded: false,
      isDownloading: false,
    })
  })
})
