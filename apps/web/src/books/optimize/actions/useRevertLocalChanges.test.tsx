// @vitest-environment jsdom

import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react"
import {
  type BookDocType,
  type LinkDocTypeForProvider,
  ReadingStateState,
} from "@oboku/shared"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const {
  downloadBook,
  getBookFile,
  removeDownloadFile,
  showConfirmDialog,
  useDownloadBook,
  useRemoveDownloadFile,
} = vi.hoisted(function createRevertMocks() {
  const downloadBook = vi.fn(async function downloadReplacement() {})
  const removeDownloadFile = vi.fn(async function removeCurrentDownload() {})

  return {
    downloadBook,
    getBookFile: vi.fn(async function getCachedBookFile(): Promise<{
      data: File
    } | null> {
      return null
    }),
    removeDownloadFile,
    showConfirmDialog: vi.fn(async function confirmRevert() {
      return true
    }),
    useDownloadBook: vi.fn(function useMockDownloadBook() {
      return { mutateAsync: downloadBook }
    }),
    useRemoveDownloadFile: vi.fn(function useMockRemoveDownloadFile() {
      return { mutateAsync: removeDownloadFile }
    }),
  }
})

vi.mock("../../../common/dialogs/presets", function mockDialogs() {
  return { showConfirmDialog }
})
vi.mock("../../../download", function mockDownloads() {
  return { useDownloadBook }
})
vi.mock("../../../download/getBookFile.shared", function mockGetBookFile() {
  return { getBookFile }
})
vi.mock(
  "../../../download/useRemoveDownloadFile",
  function mockRemoveDownloadFile() {
    return { useRemoveDownloadFile }
  },
)

import { useRevertLocalChanges } from "./useRevertLocalChanges"

const book: BookDocType = {
  _id: "book-1",
  _rev: "1-book",
  collections: [],
  createdAt: 1,
  isAttachedToDataSource: true,
  lastMetadataUpdateError: null,
  lastMetadataUpdatedAt: null,
  links: ["link-1"],
  metadataUpdateStatus: null,
  modifiedAt: null,
  readingStateCurrentBookmarkLocation: null,
  readingStateCurrentBookmarkProgressPercent: 0,
  readingStateCurrentBookmarkProgressUpdatedAt: null,
  readingStateCurrentState: ReadingStateState.NotStarted,
  rx_model: "book",
  rxdbMeta: { lwt: 1 },
  tags: [],
}

const link: LinkDocTypeForProvider<"URI"> = {
  _id: "link-1",
  _rev: "1-link",
  book: book._id,
  createdAt: "2026-08-01T00:00:00.000Z",
  data: { url: "https://example.com/book.epub" },
  modifiedAt: null,
  rx_model: "link",
  rxdbMeta: { lwt: 1 },
  type: "URI",
}

function createWrapper(onMutationError?: (error: Error) => void) {
  const queryClient = new QueryClient({
    mutationCache: new MutationCache({ onError: onMutationError }),
  })

  return function RevertQueryClientProvider({
    children,
  }: {
    children: ReactNode
  }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

function createDeferred() {
  let resolve = function resolveImmediately() {}
  let reject = function rejectImmediately(_error: Error) {}
  const promise = new Promise<void>(
    function captureResolution(resolvePromise, rejectPromise) {
      resolve = resolvePromise
      reject = rejectPromise
    },
  )

  return { promise, reject, resolve }
}

describe("useRevertLocalChanges", function testUseRevertLocalChanges() {
  beforeEach(function resetMocks() {
    vi.clearAllMocks()
  })

  it("stays pending until the replacement download completes", async function awaitReplacementDownload() {
    const replacementDownload = createDeferred()
    downloadBook.mockReturnValueOnce(replacementDownload.promise)
    const { result } = renderHook(
      function renderUseRevertLocalChanges() {
        return useRevertLocalChanges({ book, link })
      },
      {
        wrapper: createWrapper(),
      },
    )

    await act(async function startRevert() {
      await result.current.revertLocalChanges()
    })

    await waitFor(function waitForReplacementDownload() {
      expect(downloadBook).toHaveBeenCalledWith({
        _id: book._id,
        links: book.links,
      })
    })

    expect(result.current.isReverting).toBe(true)
    expect(removeDownloadFile).toHaveBeenCalledWith({ bookId: book._id })
    expect(useRemoveDownloadFile).toHaveBeenCalledWith({
      meta: { suppressGlobalErrorToast: true },
    })
    expect(useDownloadBook).toHaveBeenCalledWith({
      meta: { suppressGlobalErrorToast: true },
    })

    await act(async function finishReplacementDownload() {
      replacementDownload.resolve()
      await replacementDownload.promise
    })

    await waitFor(function waitForRevertToFinish() {
      expect(result.current.isReverting).toBe(false)
    })
  })

  it("reports a replacement download failure through the revert mutation", async function reportReplacementDownloadFailure() {
    const replacementDownload = createDeferred()
    const error = new Error("replacement download failed")
    const onMutationError = vi.fn(function reportGlobalMutationError(
      _error: Error,
    ) {})
    downloadBook.mockReturnValueOnce(replacementDownload.promise)
    const { result } = renderHook(
      function renderUseRevertLocalChanges() {
        return useRevertLocalChanges({ book, link })
      },
      {
        wrapper: createWrapper(onMutationError),
      },
    )

    await act(async function startRevert() {
      await result.current.revertLocalChanges()
    })

    await waitFor(function waitForReplacementDownload() {
      expect(downloadBook).toHaveBeenCalledTimes(1)
    })

    await act(async function failReplacementDownload() {
      replacementDownload.reject(error)

      await replacementDownload.promise.catch(function ignoreExpectedError() {})
    })

    await waitFor(function waitForErrorNotification() {
      expect(onMutationError).toHaveBeenCalledTimes(1)
      expect(onMutationError.mock.calls[0]?.[0]).toBe(error)
      expect(result.current.isReverting).toBe(false)
    })
  })

  it("puts the previous local file back when the replacement download fails", async function restorePreviousLocalFile() {
    const previousLocalFile = new File(["previous"], "book.epub")
    const error = new Error("replacement download failed")
    const onMutationError = vi.fn(function reportGlobalMutationError(
      _error: Error,
    ) {})
    getBookFile.mockResolvedValueOnce({ data: previousLocalFile })
    downloadBook.mockRejectedValueOnce(error)
    const { result } = renderHook(
      function renderUseRevertLocalChanges() {
        return useRevertLocalChanges({ book, link })
      },
      {
        wrapper: createWrapper(onMutationError),
      },
    )

    await act(async function startRevert() {
      await result.current.revertLocalChanges()
    })

    await waitFor(function waitForLocalFileRestore() {
      expect(downloadBook).toHaveBeenNthCalledWith(2, {
        _id: book._id,
        links: book.links,
        file: previousLocalFile,
      })
    })

    expect(getBookFile).toHaveBeenCalledWith(book._id)
    expect(getBookFile.mock.invocationCallOrder[0]).toBeLessThan(
      removeDownloadFile.mock.invocationCallOrder[0] ?? 0,
    )

    await waitFor(function waitForErrorNotification() {
      expect(onMutationError).toHaveBeenCalledTimes(1)
      expect(onMutationError.mock.calls[0]?.[0]).toBe(error)
      expect(result.current.isReverting).toBe(false)
    })
  })
})
