import { act, cleanup, render, screen, waitFor } from "@testing-library/react"
import type { Manifest } from "@prose-reader/shared"
import { MemoryRouter } from "react-router"
import { SIGNAL_RESET } from "reactjrx"
import { NEVER } from "rxjs"
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
      id: "chapter",
      index: 0,
      href: "http://localhost/streamer/book-1/chapter.xhtml",
      mediaType: "application/xhtml+xml",
      containerUri: "chapter.xhtml",
    },
  ],
  items: [
    {
      id: "chapter",
      href: "http://localhost/streamer/book-1/chapter.xhtml",
      mediaType: "application/xhtml+xml",
    },
  ],
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

  return {
    events,
    readers,
    accountSettings,
    opening,
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

vi.mock("./progress/useSyncBookProgress", function mockSyncBookProgress() {
  return { useSyncBookProgress: function useNoBookProgressSync() {} }
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
        <div style={{ width: 600, height: 800 }}>
          <Reader bookId={BOOK_ID} isPreview={false} />
        </div>
      </ThemeProvider>
    </MemoryRouter>
  )
}

const waitForReaderCount = (count: number) =>
  waitFor(function expectReaderCount() {
    expect(mocks.readers).toHaveLength(count)
  })

describe("Reader", () => {
  beforeEach(function resetReaderAndSettings() {
    localSettingsSignal.update(SIGNAL_RESET)
    mocks.events.length = 0
    mocks.readers.length = 0
    mocks.opening.manifest = createManifest()
    mocks.opening.bookToOpen = undefined
    mocks.accountSettings = {}
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
})
