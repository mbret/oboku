// @vitest-environment jsdom

import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const { getBookFile } = vi.hoisted(function createExportMocks() {
  return {
    getBookFile: vi.fn(async function getCachedBookFile(): Promise<{
      data: File
    } | null> {
      return null
    }),
  }
})

vi.mock("./getBookFile.shared", function mockBookFile() {
  return { getBookFile }
})

import { useExportBookFileToDevice } from "./useExportBookFileToDevice"

const file = new File(["book"], "book.epub", { type: "application/epub+zip" })

function createWrapper(onMutationError: (error: Error) => void) {
  const queryClient = new QueryClient({
    mutationCache: new MutationCache({ onError: onMutationError }),
  })

  return function ExportQueryClientProvider({
    children,
  }: {
    children: ReactNode
  }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
}

const renderExportBookFileToDevice = (
  onMutationError = vi.fn(function reportGlobalMutationError(_error: Error) {}),
) => {
  const { result } = renderHook(
    function renderUseExportBookFileToDevice() {
      return useExportBookFileToDevice("book-id")
    },
    { wrapper: createWrapper(onMutationError) },
  )

  return { onMutationError, result }
}

describe("useExportBookFileToDevice", function testUseExportBookFileToDevice() {
  beforeEach(function resetMocks() {
    vi.clearAllMocks()
    getBookFile.mockResolvedValue({ data: file })
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:book")
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(
      function ignoreRevocation() {},
    )
  })

  it("saves the cached file on the device under its own name", async function saveCachedFile() {
    const clickedAnchors: HTMLAnchorElement[] = []
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
      function captureAnchorClick(this: HTMLAnchorElement) {
        clickedAnchors.push(this)
      },
    )
    const { result } = renderExportBookFileToDevice()

    act(function startExport() {
      result.current.exportBookFileToDevice()
    })

    await waitFor(function waitForExport() {
      expect(clickedAnchors).toHaveLength(1)
    })

    expect(getBookFile).toHaveBeenCalledWith("book-id")
    expect(URL.createObjectURL).toHaveBeenCalledWith(file)
    expect(clickedAnchors[0]?.href).toBe("blob:book")
    expect(clickedAnchors[0]?.download).toBe("book.epub")

    await waitFor(function waitForObjectUrlRelease() {
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:book")
    })
  })

  it("fails when the book has no local file", async function failWithoutCachedFile() {
    getBookFile.mockResolvedValue(null)
    const { onMutationError, result } = renderExportBookFileToDevice()

    act(function startExport() {
      result.current.exportBookFileToDevice()
    })

    await waitFor(function waitForExportFailure() {
      expect(onMutationError).toHaveBeenCalledTimes(1)
    })

    expect(onMutationError.mock.calls[0]?.[0]?.message).toBe(
      "Cannot export: no cached file for book book-id",
    )
  })
})
