import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { describe, expect, it, vi } from "vitest"

const { putDownload } = vi.hoisted(() => ({
  putDownload:
    vi.fn<
      (download: {
        id: string
        data: Blob
        filename: string
      }) => Promise<string>
    >(),
}))

vi.mock("../../../rxdb/dexie", () => ({
  dexieDb: { downloads: { put: putDownload } },
}))

vi.mock("../../../download/getBookFile.shared", () => ({
  getBookFile: async () => ({ data: new File(["book"], "book.epub") }),
  restoreCachedBookFile: ({ file }: { file: File }) => file,
}))

vi.mock("@prose-reader/archive-reader/archives/createArchiveFromZipJs", () => ({
  createArchiveFromZipJs: async () => ({ close: async () => {} }),
}))

vi.mock("@oboku/archive-metadata/web", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@oboku/archive-metadata/web")>()),
  updateArchive: async () => ({
    blob: new Blob(["optimized book"]),
    mimeType: "application/epub+zip",
    dispose: async () => {},
  }),
}))

vi.mock("./confirmApplyLocalUpdate", () => ({
  confirmApplyLocalUpdate: async () => true,
}))

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

    await waitFor(() => {
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
