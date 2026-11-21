import { type BookDocType, createBookDefaults } from "@oboku/shared"
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

const STORED_BOOK: BookDocType = {
  ...createBookDefaults(),
  _id: BOOK_ID,
  _rev: "1-book",
  rx_model: "book",
  rxdbMeta: { lwt: 1 },
}

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
  const state: { book?: BookDocType } = {}

  const toStoredDocument = (storedBook: BookDocType) => ({
    toJSON: function toStoredBook() {
      return storedBook
    },
  })

  return {
    events,
    readers,
    accountSettings,
    state,
    opening,
    useBookToOpen: vi.fn(),
    useKoreaderPositionCheck: vi.fn(
      function useDoneKoreaderPositionCheck(_options: { enabled: boolean }) {
        return { status: "done" }
      },
    ),
    useShowBookFinishedDialog: vi.fn(
      function useNoBookFinishedDialog(_options: { enabled: boolean }) {
        return { showBookFinishedDialogOnClose: vi.fn() }
      },
    ),
    incrementalBookModify: async function modifyStoredBook({
      mutationFn,
    }: {
      mutationFn: (old: BookDocType) => BookDocType
    }) {
      if (!state.book) throw new Error("No book stored")

      state.book = mutationFn(state.book)

      return toStoredDocument(state.book)
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
    useBookToOpen: function useMockBookToOpen(options: {
      usesReadingData: boolean
    }) {
      mocks.useBookToOpen(options)

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
    return { useKoreaderPositionCheck: mocks.useKoreaderPositionCheck }
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
    useIncrementalBookModify: function useMockIncrementalBookModify() {
      return { mutateAsync: mocks.incrementalBookModify }
    },
  }
})

vi.mock(
  "./navigation/useShowBookFinishedDialog",
  function mockBookFinishedDialog() {
    return { useShowBookFinishedDialog: mocks.useShowBookFinishedDialog }
  },
)

import { Reader } from "./Reader"

function TestReader({ usesReadingData = true }: { usesReadingData?: boolean }) {
  return (
    <MemoryRouter>
      <ThemeProvider>
        <SignalContextProvider>
          <div style={{ width: 600, height: 800 }}>
            <Reader bookId={BOOK_ID} usesReadingData={usesReadingData} />
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

const waitForFoundPositionInSpineItem = (
  reader: ReaderInstance,
  spineItemIndex: number,
) =>
  firstValueFrom(
    reader.navigation.readingPosition$.pipe(
      filter(function isFoundPositionInSpineItem(position) {
        return (
          position.status === "success" &&
          reader.cfi.parseCfi(position.cfi).itemIndex === spineItemIndex
        )
      }),
    ),
  )

describe("Reader", () => {
  beforeEach(function resetReaderAndSettings() {
    localSettingsSignal.update(SIGNAL_RESET)
    mocks.events.length = 0
    mocks.readers.length = 0
    mocks.opening.manifest = createManifest()
    mocks.opening.bookToOpen = undefined
    mocks.accountSettings = {}
    mocks.state.book = STORED_BOOK
    mocks.useBookToOpen.mockClear()
    mocks.useKoreaderPositionCheck.mockClear()
    mocks.useShowBookFinishedDialog.mockClear()
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

  it("saves the bookmark where the provider's reader moved, once the user leaves", async () => {
    mocks.opening.bookToOpen = null
    const { unmount } = render(<TestReader />)
    const reader = await waitForFirstReader()
    await waitForFoundPositionInSpineItem(reader, 0)

    reader.navigation.goToSpineItem({ indexOrId: 1 })
    const secondChapterPosition = await waitForFoundPositionInSpineItem(
      reader,
      1,
    )
    unmount()

    await waitFor(function expectSecondChapterPositionSaved() {
      expect(mocks.state.book?.readingStateCurrentBookmarkLocation).toBe(
        secondChapterPosition.cfi,
      )
    })
  })

  it("in preview, writes nothing to the book and turns off every feature that uses reading data", async () => {
    mocks.opening.bookToOpen = null
    const { unmount } = render(<TestReader usesReadingData={false} />)
    const reader = await waitForFirstReader()
    await waitForFoundPositionInSpineItem(reader, 0)

    reader.navigation.goToSpineItem({ indexOrId: 1 })
    await waitForFoundPositionInSpineItem(reader, 1)
    unmount()

    expect(mocks.state.book).toEqual(STORED_BOOK)
    expect(mocks.useBookToOpen).toHaveBeenCalled()
    expect(mocks.useBookToOpen).not.toHaveBeenCalledWith(
      expect.objectContaining({ usesReadingData: true }),
    )
    expect(mocks.useKoreaderPositionCheck).toHaveBeenCalled()
    expect(mocks.useKoreaderPositionCheck).not.toHaveBeenCalledWith(
      expect.objectContaining({ enabled: true }),
    )
    expect(mocks.useShowBookFinishedDialog).toHaveBeenCalled()
    expect(mocks.useShowBookFinishedDialog).not.toHaveBeenCalledWith(
      expect.objectContaining({ enabled: true }),
    )
  })

  it("exposes the reader on window while it is open, and removes it on leave", async () => {
    mocks.opening.bookToOpen = null

    const { unmount } = render(<TestReader />)

    await waitForReaderCount(1)
    await waitFor(function expectFirstReaderOnWindow() {
      expect(window.reader).toBe(mocks.readers[0])
    })

    act(function reloadManifest() {
      mocks.updateOpening({ manifest: createManifest() })
    })

    await waitForReaderCount(2)
    await waitFor(function expectRecreatedReaderOnWindow() {
      expect(window.reader).toBe(mocks.readers[1])
    })

    unmount()

    expect(window.reader).toBeUndefined()
  })
})
