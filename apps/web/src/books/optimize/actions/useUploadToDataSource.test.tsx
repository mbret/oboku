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
  getBookFile,
  notify,
  refreshBookMetadata,
  showConfirmDialog,
  upsertFile,
  usePluginUpsertFile,
} = vi.hoisted(function createUploadMocks() {
  const upsertFile = vi.fn(async function upsertBookFile(
    _variables: unknown,
  ) {})

  return {
    getBookFile: vi.fn(async function getCachedBookFile(): Promise<{
      data: File
    } | null> {
      return null
    }),
    notify: vi.fn(),
    refreshBookMetadata: vi.fn(async function refreshMetadata(
      _bookId: string,
      _options?: { force?: boolean },
    ) {}),
    showConfirmDialog: vi.fn(async function confirmUpload() {
      return true
    }),
    upsertFile,
    usePluginUpsertFile: vi.fn(function useMockPluginUpsertFile() {
      return { mutateAsync: upsertFile, progress$: undefined, slot: null }
    }),
  }
})

vi.mock("../../../download/getBookFile.shared", function mockBookFile() {
  return { getBookFile }
})
vi.mock(
  "../../../plugins/usePluginUpsertFile",
  function mockPluginUpsertFile() {
    return { usePluginUpsertFile }
  },
)
vi.mock("../../../common/dialogs/presets", function mockDialogs() {
  return { showConfirmDialog }
})
vi.mock("../../../notifications/toasts", function mockToasts() {
  return { notify }
})
vi.mock("../../useRefreshBookMetadata", function mockRefreshBookMetadata() {
  return {
    useRefreshBookMetadata: function useMockRefreshBookMetadata() {
      return refreshBookMetadata
    },
  }
})

import { useUploadToDataSource } from "./useUploadToDataSource"

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

function createWrapper(onMutationError: (error: Error) => void) {
  const queryClient = new QueryClient({
    mutationCache: new MutationCache({ onError: onMutationError }),
  })

  return function UploadQueryClientProvider({
    children,
  }: {
    children: ReactNode
  }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

describe("useUploadToDataSource", function testUseUploadToDataSource() {
  beforeEach(function resetMocks() {
    vi.clearAllMocks()
    getBookFile.mockResolvedValue({
      data: new File(["book"], "book.epub", {
        type: "application/epub+zip",
      }),
    })
  })

  it("reports a nested upload failure once at the outer mutation boundary", async function reportUploadFailureOnce() {
    const error = new Error("upload failed")
    const onMutationError = vi.fn(function reportGlobalMutationError(
      _error: Error,
    ) {})
    upsertFile.mockRejectedValueOnce(error)
    const { result } = renderHook(
      function renderUseUploadToDataSource() {
        return useUploadToDataSource({ book, link, enabled: true })
      },
      { wrapper: createWrapper(onMutationError) },
    )

    await act(async function startUpload() {
      await result.current.uploadToDataSource()
    })

    await waitFor(function waitForUploadFailure() {
      expect(onMutationError).toHaveBeenCalledTimes(1)
    })

    expect(onMutationError.mock.calls[0]?.[0]).toBe(error)
    expect(usePluginUpsertFile).toHaveBeenCalledWith({
      meta: { suppressGlobalErrorToast: true },
    })
    expect(notify).not.toHaveBeenCalled()
    expect(refreshBookMetadata).not.toHaveBeenCalled()
  })

  it("refreshes the book metadata once the new file is on the data source", async function refreshMetadataAfterUpload() {
    const { result } = renderHook(
      function renderUseUploadToDataSource() {
        return useUploadToDataSource({ book, link, enabled: true })
      },
      { wrapper: createWrapper(vi.fn()) },
    )

    await act(async function startUpload() {
      await result.current.uploadToDataSource()
    })

    await waitFor(function waitForMetadataRefresh() {
      expect(refreshBookMetadata).toHaveBeenCalledWith(book._id)
    })

    expect(notify).toHaveBeenCalledTimes(1)
  })
})
