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
const PARAGRAPHS_AFTER_THE_FIRST_PAGE =
  "<p>Whenever I find myself growing grim about the mouth, I account it high time to get to sea as soon as I can.</p>".repeat(
    40,
  )
const FIRST_SENTENCE = "Call me Ishmael."
const SECOND_SENTENCE = "Some years ago"
const DEFAULT_HIGHLIGHT_COLOR = "rgba(216, 191, 216, 1)"
const YELLOW_HIGHLIGHT_COLOR = "rgba(255, 225, 125, 1)"

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
          `<html xmlns="http://www.w3.org/1999/xhtml"><head><title>Chapter</title></head><body><p>${CHAPTER_TEXT}</p>${PARAGRAPHS_AFTER_THE_FIRST_PAGE}</body></html>`,
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

/** The reader reports a selection once the pointer that made it is released. */
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

const waitForStoredAnnotation = (database: Database) =>
  waitFor(async function getStoredAnnotation() {
    const [stored] = await database.annotation.find().exec()

    if (!stored) throw new Error("No annotation is stored")

    return stored.toJSON()
  })

const findHighlightColorCircle = (color: string) =>
  waitFor(function getHighlightColorCircle() {
    const rgbColor = color.replace("rgba", "rgb").replace(", 1)", ")")
    const circle = Array.from(
      document.querySelectorAll("[role=dialog] div"),
    ).find((element) => getComputedStyle(element).backgroundColor === rgbColor)

    if (!circle) throw new Error(`The drawer has no ${color} circle`)

    return circle
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

const waitForBookmarkLocated = (
  reader: ReadingSessionReader,
  bookmarkId: string,
) =>
  firstValueFrom(
    reader.annotations.annotationsByItemPage$.pipe(
      filter(function isBookmarkOnAPage(annotationsByItemPage) {
        return Array.from(annotationsByItemPage.values()).some(
          function hasBookmarkOnAPageOfItem(annotationsByPage) {
            return Array.from(annotationsByPage.values()).some(
              function hasBookmarkOnPage(annotations) {
                return annotations.some(
                  (annotation) => annotation.id === bookmarkId,
                )
              },
            )
          },
        )
      }),
    ),
  )

const tapPage = (
  reader: ReaderInstance,
  place: "topRightCorner" | "middle",
) => {
  const rootElement = reader.context.value.rootElement

  if (!rootElement) throw new Error("The reader is not mounted")

  const { left, right, top, bottom } = rootElement.getBoundingClientRect()
  const position =
    place === "topRightCorner"
      ? { clientX: right - 1, clientY: top + 1 }
      : { clientX: (left + right) / 2, clientY: (top + bottom) / 2 }

  for (const type of ["pointerdown", "pointerup"] as const) {
    rootElement.dispatchEvent(
      new PointerEvent(type, {
        pointerId: 1,
        isPrimary: true,
        pointerType: "mouse",
        button: 0,
        buttons: type === "pointerup" ? 0 : 1,
        ...position,
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

    const highlight = await waitForStoredAnnotation(database)
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

  it("stores the color and the note that Update in the drawer gives", async () => {
    const { database, bookId } = await createDatabaseWithBook()
    renderReader({ bookId })
    const openedReader = await waitForReadingSessionReader()
    const highlight = await insertHighlight(database, {
      bookId,
      cfi: createHighlightCfi(openedReader, FIRST_SENTENCE),
    })

    await userEvent.click(await waitForHighlightDrawn(highlight._id))
    await userEvent.click(
      await findHighlightColorCircle(YELLOW_HIGHLIGHT_COLOR),
    )
    await userEvent.type(await screen.findByRole("textbox"), "A note")
    await userEvent.click(await screen.findByRole("button", { name: "Update" }))

    await waitFor(async function expectHighlightUpdated() {
      const updated = await database.annotation.findOne(highlight._id).exec()

      expect(updated?.toJSON()).toMatchObject({
        highlightColor: YELLOW_HIGHLIGHT_COLOR,
        notes: "A note",
        modifiedAt: expect.any(String),
      })
    })
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

  it("stores a page bookmark on a tap in the top right corner of the page, and removes it on a second tap", async () => {
    const { database, bookId } = await createDatabaseWithBook()
    renderReader({ bookId })
    const { reader } = await waitForReadingSessionReader()
    await waitForCornerTapToBookmark(reader)

    tapPage(reader, "topRightCorner")

    const bookmark = await waitForStoredAnnotation(database)
    expect(bookmark).toMatchObject({
      bookId,
      highlightColor: null,
      notes: null,
      highlightedText: null,
    })
    expect(reader.cfi.parseCfi(bookmark.cfi).isCfiRange).toBe(false)

    await waitForBookmarkLocated(reader, bookmark._id)
    await act(async function commitLocatedBookmark() {})
    tapPage(reader, "topRightCorner")

    await waitFor(async function expectBookmarkRemoved() {
      expect(await database.annotation.find().exec()).toEqual([])
    })
  })

  it("in preview, has no annotations API, shows no annotation control and writes nothing", async () => {
    const { database, bookId } = await createDatabaseWithBook()
    renderReader({ bookId, usesReadingData: false })
    const openedReader = await waitForOpenedReader()

    const { reader } = openedReader

    tapPage(reader, "topRightCorner")
    await waitFor(function expectCornerTapToTurnThePage() {
      expect(reader.pagination.state.begin.pageIndexInSpineItem).toBe(1)
    })
    expect(await database.annotation.find().exec()).toEqual([])

    expect(screen.queryByRole("button", { name: "Layout" })).toBeNull()
    tapPage(reader, "middle")
    await screen.findByRole("button", { name: "Layout" })
    expect(hasAnnotationsApi(reader)).toBe(false)
    expect(
      screen.queryByRole("button", { name: "Annotations", hidden: true }),
    ).toBeNull()
    expect(
      screen.queryByRole("button", { name: "Bookmarks", hidden: true }),
    ).toBeNull()

    selectText(openedReader, FIRST_SENTENCE)
    await waitFor(function expectSelectionReported() {
      expect(reader.selection.getSelection()?.type).toBe("over")
    })
    await act(async function commitReportedSelection() {})
    expect(screen.queryByRole("button", { name: "Annotate" })).toBeNull()
  })
})
