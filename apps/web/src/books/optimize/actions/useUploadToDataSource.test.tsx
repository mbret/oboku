import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react"
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

vi.mock(
  "../../../download/getBookFile.shared",
  async function mockBookFile(importOriginal) {
    return {
      ...(await importOriginal<
        typeof import("../../../download/getBookFile.shared")
      >()),
      getBookFile,
    }
  },
)
vi.mock(
  "../../../integrations/plugins/usePluginUpsertFile",
  async function mockPluginUpsertFile(importOriginal) {
    return {
      ...(await importOriginal<
        typeof import("../../../integrations/plugins/usePluginUpsertFile")
      >()),
      usePluginUpsertFile,
    }
  },
)
vi.mock(
  "../../../common/dialogs/presets",
  async function mockDialogs(importOriginal) {
    return {
      ...(await importOriginal<
        typeof import("../../../common/dialogs/presets")
      >()),
      showConfirmDialog,
    }
  },
)
vi.mock(
  "../../../notifications/toasts",
  async function mockToasts(importOriginal) {
    return {
      ...(await importOriginal<
        typeof import("../../../notifications/toasts")
      >()),
      notify,
    }
  },
)
vi.mock(
  "../../useRefreshBookMetadata",
  async function mockRefreshBookMetadata(importOriginal) {
    return {
      ...(await importOriginal<
        typeof import("../../useRefreshBookMetadata")
      >()),
      useRefreshBookMetadata: function useMockRefreshBookMetadata() {
        return refreshBookMetadata
      },
    }
  },
)

import { book, link } from "../bookLink.fixture"
import { useUploadToDataSource } from "./useUploadToDataSource"

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
