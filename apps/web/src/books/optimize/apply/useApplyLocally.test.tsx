import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { describe, expect, it, vi } from "vitest"

const { putDownload } = vi.hoisted(function createDexieMocks() {
  return {
    putDownload:
      vi.fn<
        (download: {
          id: string
          data: Blob
          filename: string
        }) => Promise<string>
      >(),
  }
})

vi.mock("../../../rxdb/dexie", function mockDexie() {
  return { dexieDb: { downloads: { put: putDownload } } }
})

vi.mock("../../../download/getBookFile.shared", function mockBookFile() {
  return {
    getBookFile: async function getCachedBookFile() {
      return { data: new File(["book"], "book.epub") }
    },
    restoreCachedBookFile: function restoreCachedBookFile({
      file,
    }: {
      file: File
    }) {
      return file
    },
  }
})

vi.mock(
  "@prose-reader/archive-reader/archives/createArchiveFromZipJs",
  function mockArchiveCreation() {
    return {
      createArchiveFromZipJs: async function createArchive() {
        return { close: async function closeArchive() {} }
      },
    }
  },
)

vi.mock(
  "@oboku/archive-metadata/web",
  async function mockArchiveUpdate(importOriginal) {
    return {
      ...(await importOriginal<typeof import("@oboku/archive-metadata/web")>()),
      updateArchive: async function updateArchive() {
        return {
          blob: new Blob(["optimized book"]),
          mimeType: "application/epub+zip",
          dispose: async function disposeUpdatedArchive() {},
        }
      },
    }
  },
)

vi.mock("./confirmApplyLocalUpdate", function mockConfirmation() {
  return {
    confirmApplyLocalUpdate: async function confirmApplyLocalUpdate() {
      return true
    },
  }
})

import { downloadsBroadcast } from "../../../download/downloadsBroadcast"
import { useApplyLocally } from "./useApplyLocally"

describe("useApplyLocally", () => {
  it("tells the other tabs once the rewritten file is stored", async () => {
    const pendingPut = Promise.withResolvers<string>()
    putDownload.mockReturnValueOnce(pendingPut.promise)
    const broadcast = vi.spyOn(downloadsBroadcast, "broadcast")
    const queryClient = new QueryClient()

    const { result } = renderHook(
      function useRenderedApplyLocally() {
        return useApplyLocally()
      },
      {
        wrapper: function Wrapper({ children }: { children: ReactNode }) {
          return (
            <QueryClientProvider client={queryClient}>
              {children}
            </QueryClientProvider>
          )
        },
      },
    )

    const applying = result.current.applyLocally({
      bookId: "book-a",
      actions: [],
    })

    await waitFor(function waitForStore() {
      expect(putDownload).toHaveBeenCalledWith(
        expect.objectContaining({ id: "book-a" }),
      )
    })
    expect(broadcast).not.toHaveBeenCalled()

    pendingPut.resolve("book-a")
    await applying

    expect(broadcast).toHaveBeenCalledWith("downloads-changed")
  })
})
