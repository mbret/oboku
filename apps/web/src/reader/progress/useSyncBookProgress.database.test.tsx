import { createBookDefaults, ReadingStateState } from "@oboku/shared"
import type { ReadingPosition } from "@prose-reader/core"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook } from "@testing-library/react"
import type { ReactNode } from "react"
import { removeRxDatabase } from "rxdb"
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie"
import { firstValueFrom, NEVER, Subject } from "rxjs"
import { describe, expect, it, onTestFinished, vi } from "vitest"
import { RXDB_DATABASE_NAME } from "../../rxdb/constants.shared"
import { getLatestDatabase, useReCreateDb } from "../../rxdb/RxDbProvider"
import { useSyncBookProgress } from "./useSyncBookProgress"

type FakeReader = {
  navigation: { readingPosition$: Subject<ReadingPosition> }
  pagination: { state$: typeof NEVER }
  spineItemsManager: { get: () => undefined }
  koreader: { cfiToProgress: () => undefined }
}

const mocks = vi.hoisted(function createReaderMocks() {
  const state: { reader?: FakeReader } = {}

  return { state }
})

vi.mock("@prose-reader/react-reader", function mockReactReader() {
  return {
    useReader: function useMockReader() {
      return mocks.state.reader
    },
  }
})

const FIRST_PAGE: ReadingPosition = {
  cfi: "epubcfi(/6/2!/4/2/1:0)",
  percentageEstimateOfBook: 0,
  status: "success",
}

const NEXT_PAGE: ReadingPosition = {
  cfi: "epubcfi(/6/4!/4/2/1:0)",
  percentageEstimateOfBook: 0.25,
  status: "success",
}

const MORE_THAN_THE_SAVE_INTERVAL_MS = 3000

function createFakeReader() {
  const reader: FakeReader = {
    navigation: { readingPosition$: new Subject() },
    pagination: { state$: NEVER },
    spineItemsManager: {
      get: function getNoSpineItem() {
        return undefined
      },
    },
    koreader: {
      cfiToProgress: function toNoKoreaderProgress() {
        return undefined
      },
    },
  }

  mocks.state.reader = reader

  return reader
}

async function createDatabaseWithBook() {
  await removeRxDatabase(RXDB_DATABASE_NAME, getRxStorageDexie())

  const queryClient = new QueryClient()
  const wrapper = function QueryWrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    )
  }
  const { result, unmount } = renderHook(useReCreateDb, { wrapper })
  onTestFinished(unmount)

  await result.current.mutateAsync({})
  const database = await firstValueFrom(getLatestDatabase())
  onTestFinished(async function removeDatabase() {
    await database.remove()
  })
  const book = await database.book.post(createBookDefaults())

  const renderSyncBookProgress = () =>
    renderHook(
      function renderUseSyncBookProgress() {
        useSyncBookProgress(book._id, {
          enabled: true,
          koreaderDocument: "koreader-document",
        })
      },
      { wrapper },
    )

  return { book, renderSyncBookProgress }
}

describe("useSyncBookProgress with the book database", () => {
  it("saves the reading position found within a second of opening when the reader closes", async () => {
    const { book, renderSyncBookProgress } = await createDatabaseWithBook()
    const reader = createFakeReader()
    const { unmount } = renderSyncBookProgress()

    reader.navigation.readingPosition$.next(FIRST_PAGE)
    unmount()

    await vi.waitFor(function expectFirstPageSaved() {
      expect(book.getLatest().toJSON()).toMatchObject({
        readingStateCurrentState: ReadingStateState.Reading,
        readingStateCurrentBookmarkLocation: FIRST_PAGE.cfi,
      })
    })
  })

  it("saves the new reading position when the reader closes within a second of a page turn", async () => {
    const { book, renderSyncBookProgress } = await createDatabaseWithBook()
    const reader = createFakeReader()
    const { unmount } = renderSyncBookProgress()

    reader.navigation.readingPosition$.next(FIRST_PAGE)
    await vi.waitFor(
      function expectFirstPageSaved() {
        expect(book.getLatest().readingStateCurrentBookmarkLocation).toBe(
          FIRST_PAGE.cfi,
        )
      },
      { timeout: MORE_THAN_THE_SAVE_INTERVAL_MS },
    )
    reader.navigation.readingPosition$.next(NEXT_PAGE)
    unmount()

    await vi.waitFor(function expectNextPageSaved() {
      expect(book.getLatest().toJSON()).toMatchObject({
        readingStateCurrentBookmarkLocation: NEXT_PAGE.cfi,
        readingStateCurrentBookmarkProgressPercent:
          NEXT_PAGE.percentageEstimateOfBook,
      })
    })
  })
})
