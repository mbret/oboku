import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { cleanup, renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { dexieDb } from "../rxdb/dexie"
import { useHasReadStoredDownloads } from "./useStoredDownloads"

describe("useHasReadStoredDownloads", () => {
  afterEach(async function clearStoredDownloads() {
    cleanup()
    await dexieDb.downloads.clear()
  })

  it("turns true once the stored downloads have been read", async () => {
    await dexieDb.downloads.put({
      id: "book-a",
      data: new Blob(["book"]),
      filename: "book-a.epub",
    })
    const onRender = vi.fn<(hasRead: boolean) => void>()
    const queryClient = new QueryClient()

    const { result } = renderHook(
      function useRenderedHasRead() {
        const hasRead = useHasReadStoredDownloads()

        onRender(hasRead)

        return hasRead
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

    expect(onRender).toHaveBeenNthCalledWith(1, false)

    await waitFor(function waitForRead() {
      expect(result.current).toBe(true)
    })
  })
})
