// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(function createManifestMocks() {
  return {
    fetchManifest: vi.fn<() => Promise<Response>>(),
    getBookKoreaderDocument: vi.fn<(bookId: string) => Promise<string>>(),
  }
})

vi.mock("../streamer/webStreamer", function mockWebStreamer() {
  return { webStreamer: { fetchManifest: mocks.fetchManifest } }
})

vi.mock("../../rxdb", function mockDatabase() {
  return {
    useDatabase: function useMockDatabase() {
      return {
        db: {
          book: {
            findOne: function findNoBook() {
              return {
                exec: async function resolveNoBook() {
                  return null
                },
              }
            },
          },
        },
      }
    },
  }
})

vi.mock(
  "../../koreader/getBookKoreaderDocument",
  function mockKoreaderDocument() {
    return { getBookKoreaderDocument: mocks.getBookKoreaderDocument }
  },
)

import { useManifest } from "./useManifest"

const BOOK_ID = "book-1"
const KOREADER_DOCUMENT = "8f3a9c1e0b7d4f2a6c5e1d0b9a8f7e6d"

function renderManifest() {
  const queryClient = new QueryClient()

  return renderHook(
    function renderUseManifest() {
      return useManifest(BOOK_ID)
    },
    {
      wrapper: function QueryClientWrapper({
        children,
      }: {
        children: ReactNode
      }) {
        return (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        )
      },
    },
  )
}

describe("useManifest", () => {
  beforeEach(() => {
    mocks.fetchManifest.mockReset()
    mocks.fetchManifest.mockImplementation(
      async function respondWithManifest() {
        return new Response(JSON.stringify({ filename: "a-book.epub" }))
      },
    )
    mocks.getBookKoreaderDocument.mockReset()
  })

  it("loads the KOReader document of the book's file with its manifest", async () => {
    mocks.getBookKoreaderDocument.mockResolvedValue(KOREADER_DOCUMENT)

    const { result } = renderManifest()

    await waitFor(function expectBookLoaded() {
      expect(result.current.data).toMatchObject({
        manifest: { filename: "a-book.epub" },
        koreaderDocument: KOREADER_DOCUMENT,
      })
    })
    expect(mocks.getBookKoreaderDocument).toHaveBeenCalledWith(BOOK_ID)
  })
})
