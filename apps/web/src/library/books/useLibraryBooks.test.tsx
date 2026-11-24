import { ReadingStateState } from "@oboku/shared"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { SIGNAL_RESET } from "reactjrx"
import { BehaviorSubject } from "rxjs"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { DownloadState } from "../../download/states"
import { dexieDb } from "../../rxdb/dexie"
import { libraryStateSignal } from "./states"
import { useLibraryBooks } from "./useLibraryBooks"

type FakeBook = {
  _id: string
  createdAt: number
  readingStateCurrentState: ReadingStateState
  tags: string[]
}

type FakeBookEntry = { _id: string; toJSON: () => FakeBook }

const { observeBookEntries } = vi.hoisted(() => ({
  observeBookEntries: vi.fn(),
}))

vi.mock("../../rxdb/RxDbProvider", async function mockRxDbProvider() {
  const { of } = await import("rxjs")
  const fakeDatabase = {
    book: { find: () => ({ $: observeBookEntries() }) },
    tag: { find: () => ({ $: of([]) }) },
  }

  return {
    latestDatabase$: of(fakeDatabase),
    getLatestDatabase: () => of(fakeDatabase),
    useReCreateDb: () => undefined,
    useDatabase: () => ({ db: fakeDatabase }),
    ensureDatabase: () => fakeDatabase,
    RxDbProvider: () => null,
  }
})

function createBookEntry(book: FakeBook): FakeBookEntry {
  return { _id: book._id, toJSON: () => book }
}

const olderBook: FakeBook = {
  _id: "older",
  createdAt: 1,
  readingStateCurrentState: ReadingStateState.NotStarted,
  tags: [],
}

const newerBook: FakeBook = {
  _id: "newer",
  createdAt: 2,
  readingStateCurrentState: ReadingStateState.Reading,
  tags: [],
}

function storeDownload(bookId: string) {
  return dexieDb.downloads.put({
    id: bookId,
    data: new Blob(["book"]),
    filename: `${bookId}.epub`,
  })
}

function QueryClientWrapper({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      {children}
    </QueryClientProvider>
  )
}

describe("useLibraryBooks", () => {
  let bookEntries$: BehaviorSubject<FakeBookEntry[]>

  beforeEach(function resetLibraryAndBooks() {
    libraryStateSignal.update(SIGNAL_RESET)
    bookEntries$ = new BehaviorSubject([
      createBookEntry(olderBook),
      createBookEntry(newerBook),
    ])
    observeBookEntries.mockReturnValue(bookEntries$)
  })

  afterEach(async function clearStoredDownloads() {
    await dexieDb.downloads.clear()
  })

  it("lists the book ids sorted by the library sorting", async () => {
    const { result } = renderHook(() => useLibraryBooks(), {
      wrapper: QueryClientWrapper,
    })

    await waitFor(() => expect(result.current).toEqual(["newer", "older"]))
  })

  it("keeps the same array when the books change but their ids do not", async () => {
    const { result } = renderHook(() => useLibraryBooks(), {
      wrapper: QueryClientWrapper,
    })

    await waitFor(() => expect(result.current).toEqual(["newer", "older"]))

    const firstBookIds = result.current

    act(function updateABookWithoutChangingTheList() {
      bookEntries$.next([
        createBookEntry(olderBook),
        createBookEntry({ ...newerBook, tags: ["tag"] }),
      ])
    })

    await waitFor(() => expect(result.current).toEqual(["newer", "older"]))
    expect(result.current).toBe(firstBookIds)
  })

  it("returns a new array when the ids change", async () => {
    const { result } = renderHook(() => useLibraryBooks(), {
      wrapper: QueryClientWrapper,
    })

    await waitFor(() => expect(result.current).toEqual(["newer", "older"]))

    act(function removeABook() {
      bookEntries$.next([createBookEntry(olderBook)])
    })

    await waitFor(() => expect(result.current).toEqual(["older"]))
  })

  it("returns a new array when a filter changes the ids", async () => {
    const { result } = renderHook(() => useLibraryBooks(), {
      wrapper: QueryClientWrapper,
    })

    await waitFor(() => expect(result.current).toEqual(["newer", "older"]))

    act(function filterReadingBooks() {
      libraryStateSignal.update((state) => ({
        ...state,
        readingStates: [ReadingStateState.Reading],
      }))
    })

    await waitFor(() => expect(result.current).toEqual(["newer"]))
  })

  it("keeps the same array when the sorting changes but not the order", async () => {
    bookEntries$.next([createBookEntry(newerBook)])

    const { result } = renderHook(() => useLibraryBooks(), {
      wrapper: QueryClientWrapper,
    })

    await waitFor(() => expect(result.current).toEqual(["newer"]))

    const firstBookIds = result.current

    act(function sortAlphabetically() {
      libraryStateSignal.update((state) => ({ ...state, sorting: "alpha" }))
    })

    expect(result.current).toBe(firstBookIds)
  })

  it("lists the stored books under the downloaded filter", async () => {
    libraryStateSignal.update(function filterDownloadedBooks(state) {
      return { ...state, downloadState: DownloadState.Downloaded }
    })
    await storeDownload("older")

    const { result } = renderHook(
      function useRenderedLibraryBooks() {
        return useLibraryBooks()
      },
      { wrapper: QueryClientWrapper },
    )

    await waitFor(function waitForOlderBook() {
      expect(result.current).toEqual(["older"])
    })

    await storeDownload("newer")

    await waitFor(function waitForBothBooks() {
      expect(result.current).toEqual(["newer", "older"])
    })

    await dexieDb.downloads.delete("older")

    await waitFor(function waitForNewerBook() {
      expect(result.current).toEqual(["newer"])
    })
  })
})
