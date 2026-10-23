import {
  type BookDocType,
  createBookDefaults,
  ReadingStateState,
} from "@oboku/shared"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, cleanup, renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(function createBookToOpenMocks() {
  return { readStoredBook: vi.fn((): BookDocType | null => null) }
})

vi.mock("../books/states", async function mockBookQuery(importOriginal) {
  const { skipToken } = await import("@tanstack/react-query")
  const { of } = await import("rxjs")

  return {
    ...(await importOriginal<typeof import("../books/states")>()),
    createBookQueryOptions: function createStoredBookQueryOptions({
      id,
    }: {
      id?: string
    }) {
      return {
        queryKey: ["stored-book", id],
        queryFn:
          id === undefined
            ? skipToken
            : function readStoredBook() {
                return of(mocks.readStoredBook())
              },
      }
    },
  }
})

import { useBookToOpen } from "./useBookToOpen"

const BOOK_ID = "book-1"

const STORED_BOOK: BookDocType = {
  ...createBookDefaults(),
  _id: BOOK_ID,
  _rev: "2-book",
  rx_model: "book",
  rxdbMeta: { lwt: 1 },
  readingStateCurrentState: ReadingStateState.Reading,
  readingStateCurrentBookmarkLocation: "epubcfi(/6/4!/4/2/1:0)",
}

const BOOK_SAVED_BY_CHECK: BookDocType = {
  ...STORED_BOOK,
  _rev: "3-book",
  readingStateCurrentBookmarkLocation: null,
  readingStateCurrentBookmarkKoreaderProgress:
    "/body/DocFragment[9]/body/p[12]/text().4",
}

const deliverQueryUpdates = () =>
  act(async function waitForQueryNotifications() {
    await new Promise(function waitForNextTask(resolve) {
      setTimeout(resolve, 0)
    })
  })

const renderBookToOpen = ({
  isPreview = false,
  mayOpen,
}: {
  isPreview?: boolean
  mayOpen: boolean
}) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { gcTime: 0 } },
  })

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )

  const rendered = renderHook(
    function renderUseBookToOpen(props: { mayOpen: boolean }) {
      return useBookToOpen({ bookId: BOOK_ID, isPreview, ...props })
    },
    { wrapper, initialProps: { mayOpen } },
  )

  return { ...rendered, queryClient }
}

describe("useBookToOpen", () => {
  beforeEach(() => {
    mocks.readStoredBook.mockReset().mockReturnValue(STORED_BOOK)
  })

  afterEach(() => {
    cleanup()
  })

  it("reads the book only once it may open", async () => {
    const { result, rerender } = renderBookToOpen({ mayOpen: false })

    await deliverQueryUpdates()

    expect(mocks.readStoredBook).not.toHaveBeenCalled()
    expect(result.current).toBeUndefined()

    rerender({ mayOpen: true })

    await waitFor(function expectStoredBook() {
      expect(result.current).toEqual(STORED_BOOK)
    })
  })

  it("opens at the bookmark the KOReader position check wrote, before the live book query has it", async () => {
    const { result, rerender, queryClient } = renderBookToOpen({
      mayOpen: false,
    })

    await deliverQueryUpdates()
    queryClient.setQueryData(["stored-book", BOOK_ID], STORED_BOOK)
    mocks.readStoredBook.mockReturnValue(BOOK_SAVED_BY_CHECK)
    rerender({ mayOpen: true })

    await waitFor(function expectBookSavedByCheck() {
      expect(result.current).toEqual(BOOK_SAVED_BY_CHECK)
    })
  })

  it("keeps a book missing from the database closed", async () => {
    mocks.readStoredBook.mockReturnValue(null)
    const { result } = renderBookToOpen({ mayOpen: true })

    await waitFor(function expectBookRead() {
      expect(mocks.readStoredBook).toHaveBeenCalled()
    })
    await deliverQueryUpdates()

    expect(result.current).toBeUndefined()
  })

  it("opens at the start in preview, without reading the book", async () => {
    const { result } = renderBookToOpen({ isPreview: true, mayOpen: true })

    await deliverQueryUpdates()

    expect(result.current).toBeNull()
    expect(mocks.readStoredBook).not.toHaveBeenCalled()
  })
})
