import { createBookDefaults } from "@oboku/shared"
import type { Manifest } from "@prose-reader/shared"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import {
  act,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react"
import type { ReactNode } from "react"
import { MemoryRouter } from "react-router"
import { SignalContextProvider } from "reactjrx"
import { filter, firstValueFrom } from "rxjs"
import { describe, expect, it, onTestFinished, vi } from "vitest"
import { userEvent } from "vitest/browser"
import type { Database } from "../rxdb"
import { getLatestDatabase, useReCreateDb } from "../rxdb/RxDbProvider"
import { ThemeProvider } from "../theme/ThemeProvider"
import type { createReadingSessionReader } from "./createAppReader"
import type { ReaderInstance } from "./states"

type ReadingSessionReader = ReturnType<typeof createReadingSessionReader>

const CHAPTER_TEXT =
  "Call me Ishmael. Some years ago, never mind how long precisely, having little money in my purse."
const FIRST_SENTENCE = "Call me Ishmael."
const SECOND_SENTENCE = "Some years ago"
const DEFAULT_HIGHLIGHT_COLOR = "rgba(216, 191, 216, 1)"

const MANIFEST: Manifest = {
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
      href: "http://localhost/streamer/book/chapter-1.xhtml",
      mediaType: "application/xhtml+xml",
      containerUri: "chapter-1.xhtml",
    },
  ],
  items: [
    {
      id: "chapter-1",
      href: "http://localhost/streamer/book/chapter-1.xhtml",
      mediaType: "application/xhtml+xml",
    },
  ],
}

vi.mock("./streamer/webStreamer", function mockWebStreamer() {
  return {
    webStreamer: {
      prune: function pruneNothing() {},
      accessArchive: function holdNoArchive() {
        throw new Error("The book has no PDF")
      },
      fetchResource: async function fetchChapter() {
        return new Response(
          `<html xmlns="http://www.w3.org/1999/xhtml"><head><title>Chapter</title></head><body><p>${CHAPTER_TEXT}</p></body></html>`,
          { headers: { "content-type": "application/xhtml+xml" } },
        )
      },
    },
  }
})

vi.mock("./manifest/useManifest", function mockManifest() {
  return {
    useManifest: function useLoadedManifest() {
      return {
        data: {
          manifest: MANIFEST,
          isUsingWebStreamer: true,
          koreaderDocument: "koreader-document",
        },
        error: undefined,
      }
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

vi.mock(
  "./navigation/useShowBookFinishedDialog",
  function mockBookFinishedDialog() {
    return {
      useShowBookFinishedDialog: function useNoBookFinishedDialog() {
        return { showBookFinishedDialogOnClose: function closeNothing() {} }
      },
    }
  },
)

import { Reader } from "./Reader"

const createDatabaseWithBook = async () => {
  const { result, unmount } = renderHook(useReCreateDb, {
    wrapper: function QueryWrapper({ children }: { children: ReactNode }) {
      return (
        <QueryClientProvider client={new QueryClient()}>
          {children}
        </QueryClientProvider>
      )
    },
  })
  await result.current.mutateAsync({})
  unmount()
  const database = await firstValueFrom(getLatestDatabase())
  onTestFinished(async function removeDatabase() {
    await database.remove()
  })
  const book = await database.book.post(createBookDefaults())

  return { database, bookId: book._id }
}

const renderReader = ({
  bookId,
  usesReadingData = true,
}: {
  bookId: string
  usesReadingData?: boolean
}) => {
  const { unmount } = render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <ThemeProvider>
          <SignalContextProvider>
            <div style={{ width: 600, height: 800 }}>
              <Reader bookId={bookId} usesReadingData={usesReadingData} />
            </div>
          </SignalContextProvider>
        </ThemeProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  )
  onTestFinished(unmount)

  return { unmount }
}

const hasAnnotationsApi = (
  reader: ReaderInstance,
): reader is ReadingSessionReader => "annotations" in reader

const waitForChapterDocument = async (reader: ReaderInstance) => {
  await firstValueFrom(
    reader.navigation.readingPosition$.pipe(
      filter(function isPositionFound(position) {
        return position.status === "success"
      }),
    ),
  )

  return waitFor(function getChapterDocument() {
    const chapterDocument = reader.spineItemsManager
      .get(0)
      ?.renderer.getDocumentFrame()?.contentDocument
    const paragraphText = chapterDocument?.querySelector("p")?.firstChild

    if (!chapterDocument || !paragraphText) {
      throw new Error("The chapter is not loaded yet")
    }

    return { chapterDocument, paragraphText }
  })
}

const waitForOpenedReader = async () => {
  const reader = await waitFor(function getOpenedReader() {
    if (!window.reader) throw new Error("The reader is not open yet")

    return window.reader
  })
  const chapter = await waitForChapterDocument(reader)

  return { reader, ...chapter }
}

const waitForReadingSessionReader = async () => {
  const { reader, ...chapter } = await waitForOpenedReader()

  if (!hasAnnotationsApi(reader)) {
    throw new Error("The reader has no annotations API")
  }

  return { reader, ...chapter }
}

/** Selects `text` in the chapter, then releases the pointer, as a user does. */
const selectText = (
  {
    chapterDocument,
    paragraphText,
  }: Awaited<ReturnType<typeof waitForOpenedReader>>,
  text: string,
) => {
  const chapterWindow = chapterDocument.defaultView
  const start = CHAPTER_TEXT.indexOf(text)

  if (!chapterWindow) throw new Error("The chapter has no window")

  chapterDocument.dispatchEvent(new chapterWindow.PointerEvent("pointerdown"))
  chapterDocument
    .getSelection()
    ?.setBaseAndExtent(paragraphText, start, paragraphText, start + text.length)
  chapterDocument.dispatchEvent(new chapterWindow.PointerEvent("pointerup"))
}

/** The cfi the reader gives to a selection of `text`, as a highlight stores it. */
const createHighlightCfi = (
  openedReader: Awaited<ReturnType<typeof waitForReadingSessionReader>>,
  text: string,
) => {
  const { reader, chapterDocument } = openedReader

  selectText(openedReader, text)

  const selection = chapterDocument.getSelection()
  const annotation =
    selection &&
    reader.annotations.createAnnotation({ itemIndex: 0, selection })

  if (!annotation) throw new Error(`No annotation for "${text}"`)

  selection.removeAllRanges()

  return annotation.cfi
}

const insertHighlight = (
  database: Database,
  { bookId, cfi }: { bookId: string; cfi: string },
) =>
  database.annotation.insert({
    _id: crypto.randomUUID(),
    rx_model: "annotation",
    bookId,
    cfi,
    highlightColor: DEFAULT_HIGHLIGHT_COLOR,
    notes: "",
    highlightedText: null,
    createdAt: new Date().toISOString(),
    modifiedAt: null,
  })

const findHighlightRects = (annotationId: string) =>
  document.querySelectorAll(`[data-highlight-rect="${annotationId}"]`)

const waitForHighlightDrawn = (annotationId: string) =>
  waitFor(function getHighlightRect() {
    const [rect] = findHighlightRects(annotationId)

    if (!(rect instanceof HTMLElement)) {
      throw new Error(`The highlight ${annotationId} is not drawn`)
    }

    return rect
  })

/**
 * Waits until a corner tap bookmarks the first page: react-reader ignores the
 * tap until the bookmarks are located, and the page must have a node to
 * point to.
 */
const waitForCornerTapToBookmark = async (reader: ReadingSessionReader) => {
  await firstValueFrom(reader.annotations.annotationsByItemPage$)
  await firstValueFrom(
    reader.annotations.candidates$.pipe(
      filter(function isFirstPageBookmarkable([isFirstPageCandidate]) {
        return isFirstPageCandidate === true
      }),
    ),
  )
  await act(async function commitLocatedBookmarks() {})
}

/** Taps the top right corner of the page, with the mouse. */
const tapTopRightCorner = (reader: ReaderInstance) => {
  const rootElement = reader.context.value.rootElement

  if (!rootElement) throw new Error("The reader is not mounted")

  const { right, top } = rootElement.getBoundingClientRect()

  for (const type of ["pointerdown", "pointerup"] as const) {
    rootElement.dispatchEvent(
      new PointerEvent(type, {
        pointerId: 1,
        isPrimary: true,
        pointerType: "mouse",
        button: 0,
        buttons: type === "pointerup" ? 0 : 1,
        clientX: right - 1,
        clientY: top + 1,
        bubbles: true,
        cancelable: true,
      }),
    )
  }
}

describe("Reader annotations", () => {
  it("draws the stored highlights of the book when it opens, and not those of another book", async () => {
    const { database, bookId } = await createDatabaseWithBook()
    const firstReading = renderReader({ bookId })
    const openedReader = await waitForReadingSessionReader()
    const cfiOfBook = createHighlightCfi(openedReader, FIRST_SENTENCE)
    const cfiOfAnotherBook = createHighlightCfi(openedReader, SECOND_SENTENCE)
    firstReading.unmount()
    const highlightOfBook = await insertHighlight(database, {
      bookId,
      cfi: cfiOfBook,
    })
    const highlightOfAnotherBook = await insertHighlight(database, {
      bookId: "another-book",
      cfi: cfiOfAnotherBook,
    })

    renderReader({ bookId })

    await waitForHighlightDrawn(highlightOfBook._id)
    expect(findHighlightRects(highlightOfAnotherBook._id)).toHaveLength(0)
  })

  it("stores the highlight the user makes, with the book, its range, color, note and text, and draws it", async () => {
    const { database, bookId } = await createDatabaseWithBook()
    renderReader({ bookId })
    const openedReader = await waitForReadingSessionReader()

    selectText(openedReader, FIRST_SENTENCE)
    await userEvent.click(
      await screen.findByRole("button", { name: "Annotate" }),
    )
    await userEvent.type(await screen.findByRole("textbox"), "A note")
    await userEvent.click(
      await screen.findByRole("button", { name: "Highlight" }),
    )

    const highlight = await waitFor(async function getStoredHighlight() {
      const [stored] = await database.annotation.find().exec()

      if (!stored) throw new Error("No annotation is stored")

      return stored.toJSON()
    })
    expect(highlight).toMatchObject({
      bookId,
      highlightColor: DEFAULT_HIGHLIGHT_COLOR,
      notes: "A note",
      highlightedText: FIRST_SENTENCE,
    })
    expect(openedReader.reader.cfi.parseCfi(highlight.cfi)).toMatchObject({
      itemIndex: 0,
      isCfiRange: true,
    })
    await waitForHighlightDrawn(highlight._id)
  })

  it("removes the document and the drawn highlight with Remove in the drawer", async () => {
    const { database, bookId } = await createDatabaseWithBook()
    renderReader({ bookId })
    const openedReader = await waitForReadingSessionReader()
    const highlight = await insertHighlight(database, {
      bookId,
      cfi: createHighlightCfi(openedReader, FIRST_SENTENCE),
    })

    await userEvent.click(await waitForHighlightDrawn(highlight._id))
    await userEvent.click(await screen.findByRole("button", { name: "Remove" }))

    await waitFor(async function expectHighlightRemoved() {
      expect(await database.annotation.find().exec()).toEqual([])
      expect(findHighlightRects(highlight._id)).toHaveLength(0)
    })
  })

  it("stores a page bookmark on a tap in the top right corner of the page", async () => {
    const { database, bookId } = await createDatabaseWithBook()
    renderReader({ bookId })
    const { reader } = await waitForReadingSessionReader()
    await waitForCornerTapToBookmark(reader)

    tapTopRightCorner(reader)

    const bookmark = await waitFor(async function getStoredBookmark() {
      const [stored] = await database.annotation.find().exec()

      if (!stored) throw new Error("No bookmark is stored")

      return stored.toJSON()
    })
    expect(bookmark).toMatchObject({
      bookId,
      highlightColor: null,
      notes: null,
      highlightedText: null,
    })
    expect(reader.cfi.parseCfi(bookmark.cfi).isCfiRange).toBe(false)
  })

  it("in preview, has no annotations API, shows no annotation control and writes nothing", async () => {
    const { database, bookId } = await createDatabaseWithBook()
    renderReader({ bookId, usesReadingData: false })
    const openedReader = await waitForOpenedReader()

    selectText(openedReader, FIRST_SENTENCE)
    tapTopRightCorner(openedReader.reader)

    await screen.findByRole("button", { name: "Layout", hidden: true })
    expect(hasAnnotationsApi(openedReader.reader)).toBe(false)
    expect(
      screen.queryByRole("button", { name: "Annotations", hidden: true }),
    ).toBeNull()
    expect(
      screen.queryByRole("button", { name: "Bookmarks", hidden: true }),
    ).toBeNull()
    expect(screen.queryByRole("button", { name: "Annotate" })).toBeNull()
    expect(await database.annotation.find().exec()).toEqual([])
  })
})
