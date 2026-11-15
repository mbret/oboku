import { type BookDocType, createBookDefaults } from "@oboku/shared"
import type { ReadingPosition } from "@prose-reader/core"
import type { Manifest } from "@prose-reader/shared"
import { act, cleanup, render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter } from "react-router"
import { SIGNAL_RESET, SignalContextProvider } from "reactjrx"
import { filter, firstValueFrom, NEVER } from "rxjs"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  type LocalSettings,
  localSettingsSignal,
} from "../settings/useLocalSettings"
import { ThemeProvider } from "../theme/ThemeProvider"
import type { ReaderInstance } from "./states"

const BOOK_ID = "book-1"

const createManifest = (): Manifest => ({
  filename: "book.epub",
  mediaType: "application/epub+zip",
  title: "Book",
  renditionLayout: "reflowable",
  renditionSpread: undefined,
  readingDirection: "ltr",
  spineItems: [
    {
      id: "chapter-1",
      index: 0,
      href: "http://localhost/streamer/book-1/chapter-1.xhtml",
      mediaType: "application/xhtml+xml",
      containerUri: "chapter-1.xhtml",
    },
    {
      id: "chapter-2",
      index: 1,
      href: "http://localhost/streamer/book-1/chapter-2.xhtml",
      mediaType: "application/xhtml+xml",
      containerUri: "chapter-2.xhtml",
    },
  ],
  items: [
    {
      id: "chapter-1",
      href: "http://localhost/streamer/book-1/chapter-1.xhtml",
      mediaType: "application/xhtml+xml",
    },
    {
      id: "chapter-2",
      href: "http://localhost/streamer/book-1/chapter-2.xhtml",
      mediaType: "application/xhtml+xml",
    },
  ],
})

const createStoredBook = (): BookDocType => ({
  ...createBookDefaults(),
  _id: BOOK_ID,
  _rev: "1-book",
  rx_model: "book",
  rxdbMeta: { lwt: 1 },
})

type ReaderOpening = {
  manifest: Manifest | undefined
  bookToOpen: null | undefined
}

type AccountSettings = { readerGlobalFontScale?: number }

const mocks = vi.hoisted(function createReaderMocks() {
  const openingListeners = new Set<() => void>()
  const opening: ReaderOpening = { manifest: undefined, bookToOpen: undefined }
  const events: string[] = []
  const readers: ReaderInstance[] = []
  const accountSettings: AccountSettings = {}
  const store: { book?: BookDocType } = {}

  return {
    events,
    readers,
    accountSettings,
    store,
    opening,
    modifyStoredBook: async function modifyStoredBook({
      mutationFn,
    }: {
      mutationFn: (old: BookDocType) => BookDocType
    }) {
      if (!store.book) throw new Error("No book stored")

      const savedBook = mutationFn(store.book)
      store.book = savedBook

      return {
        toJSON: function toSavedBook() {
          return savedBook
        },
      }
    },
    updateOpening: function updateOpening(changes: Partial<ReaderOpening>) {
      Object.assign(opening, changes)
      for (const listener of openingListeners) listener()
    },
    subscribeToOpening: function subscribeToOpening(listener: () => void) {
      openingListeners.add(listener)

      return function unsubscribeFromOpening() {
        openingListeners.delete(listener)
      }
    },
  }
})

vi.mock(
  "./createAppReader",
  async function wrapCreateAppReader(importOriginal) {
    const actual = await importOriginal<typeof import("./createAppReader")>()

    return {
      ...actual,
      createAppReader: function createRecordedAppReader(
        options: Parameters<typeof actual.createAppReader>[0],
      ) {
        mocks.events.push("create")
        const reader = actual.createAppReader(options)
        reader.$.destroy$.subscribe(function recordDestroy() {
          mocks.events.push("destroy")
        })
        mocks.readers.push(reader)

        return reader
      },
    }
  },
)

vi.mock("./streamer/webStreamer", function mockWebStreamer() {
  return {
    webStreamer: {
      prune: function recordPrune() {
        mocks.events.push("prune")
      },
      accessArchive: function holdNoArchive() {
        return NEVER
      },
      fetchResource: async function fetchChapter() {
        return new Response(
          '<html xmlns="http://www.w3.org/1999/xhtml"><head><title>Chapter</title></head><body><p>Chapter text</p></body></html>',
          { headers: { "content-type": "application/xhtml+xml" } },
        )
      },
    },
  }
})

vi.mock("./manifest/useManifest", async function mockManifest() {
  const { useSyncExternalStore } = await import("react")

  return {
    useManifest: function useMockManifest() {
      const manifest = useSyncExternalStore(
        mocks.subscribeToOpening,
        function readManifest() {
          return mocks.opening.manifest
        },
      )

      return {
        data: manifest && {
          manifest,
          isUsingWebStreamer: true,
          koreaderDocument: "koreader-document",
        },
        error: undefined,
      }
    },
  }
})

vi.mock("./useBookToOpen", async function mockBookToOpen() {
  const { useSyncExternalStore } = await import("react")

  return {
    useBookToOpen: function useMockBookToOpen() {
      return useSyncExternalStore(
        mocks.subscribeToOpening,
        function readBookToOpen() {
          return mocks.opening.bookToOpen
        },
      )
    },
  }
})

vi.mock(
  "../integrations/koreader/client/useKoreaderPositionCheck",
  function mockKoreaderPositionCheck() {
    return {
      useKoreaderPositionCheck: function useDoneKoreaderPositionCheck() {
        return { status: "done" }
      },
    }
  },
)

vi.mock("../settings/useSettings", function mockAccountSettings() {
  return {
    useSettings: function useMockAccountSettings() {
      return { data: mocks.accountSettings }
    },
  }
})

vi.mock("../books", function mockBooks() {
  return {
    useIncrementalBookModify: function useStoredBookModify() {
      return { mutateAsync: mocks.modifyStoredBook }
    },
  }
})

vi.mock(
  "./navigation/useShowBookFinishedDialog",
  function mockBookFinishedDialog() {
    return {
      useShowBookFinishedDialog: function useNoBookFinishedDialog() {
        return { showBookFinishedDialogOnClose: vi.fn() }
      },
    }
  },
)

import { Reader } from "./Reader"

function TestReader() {
  return (
    <MemoryRouter>
      <ThemeProvider>
        <SignalContextProvider>
          <div style={{ width: 600, height: 800 }}>
            <Reader bookId={BOOK_ID} isPreview={false} />
          </div>
        </SignalContextProvider>
      </ThemeProvider>
    </MemoryRouter>
  )
}

const waitForReaderCount = (count: number) =>
  waitFor(function expectReaderCount() {
    expect(mocks.readers).toHaveLength(count)
  })

const waitForFirstReader = () =>
  waitFor(function getFirstReader() {
    const [reader] = mocks.readers

    if (!reader) throw new Error("The provider has not created a reader yet")

    return reader
  })

describe("Reader", () => {
  beforeEach(function resetReaderAndSettings() {
    localSettingsSignal.update(SIGNAL_RESET)
    mocks.events.length = 0
    mocks.readers.length = 0
    mocks.opening.manifest = createManifest()
    mocks.opening.bookToOpen = undefined
    mocks.accountSettings = {}
    mocks.store.book = createStoredBook()
  })

  afterEach(function unmountReader() {
    cleanup()
  })

  it("shows the loading screen until the reader is mounted, with the device's settings and the account's font scale", async () => {
    localSettingsSignal.update(
      function withNightTheme(settings): LocalSettings {
        return { ...settings, readerTheme: "night" }
      },
    )
    mocks.accountSettings = { readerGlobalFontScale: 1.4 }

    render(<TestReader />)

    expect(screen.getByText("Your book is loading...")).not.toBeNull()
    expect(mocks.readers).toHaveLength(0)

    act(function openBookAtStart() {
      mocks.updateOpening({ bookToOpen: null })
    })

    await waitForReaderCount(1)
    await waitFor(function expectLoadingScreenGone() {
      expect(screen.queryByText("Your book is loading...")).toBeNull()
    })
    expect(mocks.readers[0]?.settings.values).toMatchObject({
      theme: "night",
      fontScale: 1.4,
    })
  })

  it("keeps the archive while it recreates the reader, and prunes it once on leave", async () => {
    mocks.opening.bookToOpen = null

    const { unmount } = render(<TestReader />)

    await waitForReaderCount(1)

    act(function reloadManifest() {
      mocks.updateOpening({ manifest: createManifest() })
    })

    await waitForReaderCount(2)

    unmount()

    const eventsWhileReading = mocks.events.slice(0, 3)
    const eventsOnLeave = mocks.events.slice(3)

    expect(eventsWhileReading).toEqual(["create", "destroy", "create"])
    expect(eventsOnLeave.toSorted()).toEqual(["destroy", "prune"])
  })

  it("saves the position of a navigation in the reader the provider created", async () => {
    mocks.opening.bookToOpen = null
    render(<TestReader />)
    const reader = await waitForFirstReader()
    const isFoundPositionInSpineItem = (
      position: ReadingPosition,
      spineItemIndex: number,
    ) =>
      position.status === "success" &&
      reader.cfi.parseCfi(position.cfi).itemIndex === spineItemIndex
    await firstValueFrom(
      reader.navigation.readingPosition$.pipe(
        filter(function isFoundPositionInFirstChapter(position) {
          return isFoundPositionInSpineItem(position, 0)
        }),
      ),
    )

    reader.navigation.goToSpineItem({ indexOrId: 1 })

    const secondChapterPosition = await firstValueFrom(
      reader.navigation.readingPosition$.pipe(
        filter(function isFoundPositionInSecondChapter(position) {
          return isFoundPositionInSpineItem(position, 1)
        }),
      ),
    )
    await waitFor(
      function expectSecondChapterPositionSaved() {
        expect(mocks.store.book?.readingStateCurrentBookmarkLocation).toBe(
          secondChapterPosition.cfi,
        )
      },
      { timeout: 3000 },
    )
  })
})
