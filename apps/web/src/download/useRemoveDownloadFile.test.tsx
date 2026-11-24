import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { describe, expect, it, vi } from "vitest"

const { deleteDownload } = vi.hoisted(function createDexieMocks() {
  return { deleteDownload: vi.fn<(bookId: string) => Promise<void>>() }
})

vi.mock("../rxdb/dexie", function mockDexie() {
  return { dexieDb: { downloads: { delete: deleteDownload } } }
})

import { downloadsBroadcast } from "./downloadsBroadcast"
import { useRemoveDownloadFile } from "./useRemoveDownloadFile"

describe("useRemoveDownloadFile", () => {
  it("tells the other tabs once the file is deleted", async () => {
    const pendingDelete = Promise.withResolvers<void>()
    deleteDownload.mockReturnValueOnce(pendingDelete.promise)
    const broadcast = vi.spyOn(downloadsBroadcast, "broadcast")
    const queryClient = new QueryClient()

    const { result } = renderHook(
      function useRenderedRemoveDownloadFile() {
        return useRemoveDownloadFile()
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

    act(function startRemoval() {
      result.current.mutate({ bookId: "book-a" })
    })

    await waitFor(function waitForDelete() {
      expect(deleteDownload).toHaveBeenCalledWith("book-a")
    })
    expect(broadcast).not.toHaveBeenCalled()

    pendingDelete.resolve()

    await waitFor(function waitForBroadcast() {
      expect(broadcast).toHaveBeenCalledWith("downloads-changed")
    })
  })
})
