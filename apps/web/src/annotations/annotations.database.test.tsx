import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { firstValueFrom } from "rxjs"
import { describe, expect, it, onTestFinished, vi } from "vitest"
import type { RxdbAnnotationDocType } from "../rxdb/collections/annotation"
import { getLatestDatabase, useReCreateDb } from "../rxdb/RxDbProvider"
import { useAnnotations } from "./useAnnotations"
import { useCreateAnnotation } from "./useCreateAnnotation"
import { useDeleteAnnotation } from "./useDeleteAnnotation"
import { useUpdateAnnotation } from "./useUpdateAnnotation"

const BOOK_ID = "book-1"
const HIGHLIGHT_CFI = "epubcfi(/6/4!/4/2,/1:0,/1:12)"
const BOOKMARK_CFI = "epubcfi(/6/4!/4/2/1:0)"
const PURPLE = "rgba(216, 191, 216, 1)"
const YELLOW = "rgba(255, 225, 125, 1)"

const storedAnnotation = (
  fields: Pick<RxdbAnnotationDocType, "bookId" | "createdAt"> &
    Partial<RxdbAnnotationDocType>,
): RxdbAnnotationDocType => ({
  _id: crypto.randomUUID(),
  rx_model: "annotation",
  cfi: BOOKMARK_CFI,
  modifiedAt: null,
  ...fields,
})

async function renderAnnotationHooksWithDatabase({
  enabled = true,
}: {
  enabled?: boolean
} = {}) {
  const queryClient = new QueryClient()
  const { result, unmount } = renderHook(
    function renderAnnotationHooks() {
      return {
        reCreateDb: useReCreateDb(),
        annotations: useAnnotations({ bookId: BOOK_ID, enabled }),
        createAnnotation: useCreateAnnotation(),
        updateAnnotation: useUpdateAnnotation(),
        deleteAnnotation: useDeleteAnnotation(),
      }
    },
    {
      wrapper: function QueryWrapper({ children }: { children: ReactNode }) {
        return (
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        )
      },
    },
  )
  onTestFinished(unmount)

  await result.current.reCreateDb.mutateAsync({})
  const database = await firstValueFrom(getLatestDatabase())
  onTestFinished(async function removeDatabase() {
    await database.remove()
  })

  return { database, queryClient, result }
}

describe("annotation hooks", () => {
  it("give the annotations of their book only, in the order of their creation, as react-reader takes them", async () => {
    const { database, result } = await renderAnnotationHooksWithDatabase()
    const laterHighlight = storedAnnotation({
      _id: "a-highlight-created-later",
      bookId: BOOK_ID,
      cfi: HIGHLIGHT_CFI,
      highlightColor: PURPLE,
      notes: "",
      highlightedText: "Call me Ishmael",
      createdAt: "2026-11-19T11:00:00.000Z",
    })
    const earlierBookmark = storedAnnotation({
      _id: "b-bookmark-created-earlier",
      bookId: BOOK_ID,
      highlightColor: null,
      notes: null,
      highlightedText: null,
      createdAt: "2026-11-19T10:00:00.000Z",
    })
    await database.annotation.bulkInsert([
      laterHighlight,
      storedAnnotation({
        bookId: "book-2",
        createdAt: "2026-11-19T09:00:00.000Z",
      }),
      earlierBookmark,
    ])

    await waitFor(function expectAnnotationsOfBook() {
      expect(result.current.annotations.data).toStrictEqual([
        {
          id: earlierBookmark._id,
          cfi: BOOKMARK_CFI,
          highlightedText: undefined,
          highlightColor: undefined,
          notes: undefined,
        },
        {
          id: laterHighlight._id,
          cfi: HIGHLIGHT_CFI,
          highlightedText: "Call me Ishmael",
          highlightColor: PURPLE,
          notes: "",
        },
      ])
    })
  })

  it("keep the same list while no annotation of the book changes", async () => {
    const { database, queryClient, result } =
      await renderAnnotationHooksWithDatabase()
    const highlight = await database.annotation.insert(
      storedAnnotation({
        bookId: BOOK_ID,
        highlightColor: PURPLE,
        createdAt: "2026-11-19T10:00:00.000Z",
      }),
    )
    const listWithHighlight = await waitFor(function getListWithHighlight() {
      const list = result.current.annotations.data

      expect(list?.map((annotation) => annotation.id)).toEqual([highlight._id])

      return list
    })
    const onAnnotationsResult = vi.fn()
    const stopRecording = queryClient
      .getQueryCache()
      .subscribe(function recordAnnotationsResult(event) {
        const isAnnotationsResult =
          event.type === "updated" &&
          event.action.type === "success" &&
          event.query.queryKey.includes("annotations")

        if (isAnnotationsResult) onAnnotationsResult(event.query.state.data)
      })
    onTestFinished(stopRecording)

    await highlight.incrementalPatch({ modifiedAt: new Date().toISOString() })

    await waitFor(function expectNewResult() {
      expect(onAnnotationsResult).toHaveBeenCalledOnce()
    })
    expect(onAnnotationsResult.mock.calls[0]?.[0]).toBe(listWithHighlight)
    expect(result.current.annotations.data).toBe(listWithHighlight)
  })

  it("run no query when they are not enabled", async () => {
    const { database, result } = await renderAnnotationHooksWithDatabase({
      enabled: false,
    })
    await database.annotation.insert(
      storedAnnotation({
        bookId: BOOK_ID,
        createdAt: "2026-11-19T10:00:00.000Z",
      }),
    )

    expect(result.current.annotations.fetchStatus).toBe("idle")
    expect(result.current.annotations.data).toBeUndefined()
  })

  it("store a created highlight with each field it reports, and a created bookmark without color, note and text", async () => {
    const { database, result } = await renderAnnotationHooksWithDatabase()
    const highlightId = crypto.randomUUID()
    const bookmarkId = crypto.randomUUID()

    await result.current.createAnnotation.mutateAsync({
      bookId: BOOK_ID,
      annotation: {
        id: highlightId,
        cfi: HIGHLIGHT_CFI,
        highlightedText: "Call me Ishmael",
        highlightColor: PURPLE,
        notes: "A note",
      },
    })
    await result.current.createAnnotation.mutateAsync({
      bookId: BOOK_ID,
      annotation: { id: bookmarkId, cfi: BOOKMARK_CFI },
    })

    const highlight = await database.annotation.findOne(highlightId).exec()
    const bookmark = await database.annotation.findOne(bookmarkId).exec()
    expect(highlight?.toJSON()).toStrictEqual({
      _id: highlightId,
      rx_model: "annotation",
      bookId: BOOK_ID,
      cfi: HIGHLIGHT_CFI,
      highlightedText: "Call me Ishmael",
      highlightColor: PURPLE,
      notes: "A note",
      createdAt: expect.any(String),
      modifiedAt: null,
    })
    expect(bookmark?.toJSON()).toStrictEqual({
      _id: bookmarkId,
      rx_model: "annotation",
      bookId: BOOK_ID,
      cfi: BOOKMARK_CFI,
      highlightedText: null,
      highlightColor: null,
      notes: null,
      createdAt: expect.any(String),
      modifiedAt: null,
    })
  })

  it("store the empty text of a highlight as it is", async () => {
    const { database, result } = await renderAnnotationHooksWithDatabase()
    const highlightId = crypto.randomUUID()

    await result.current.createAnnotation.mutateAsync({
      bookId: BOOK_ID,
      annotation: {
        id: highlightId,
        cfi: HIGHLIGHT_CFI,
        highlightedText: "",
        highlightColor: PURPLE,
        notes: "",
      },
    })

    const highlight = await database.annotation.findOne(highlightId).exec()
    expect(highlight?.highlightedText).toBe("")
  })

  it("store the color and the note of an update, with the time of the change, and nothing else", async () => {
    const { database, result } = await renderAnnotationHooksWithDatabase()
    const highlight = storedAnnotation({
      bookId: BOOK_ID,
      cfi: HIGHLIGHT_CFI,
      highlightColor: PURPLE,
      notes: "",
      highlightedText: "Call me Ishmael",
      createdAt: "2026-11-19T10:00:00.000Z",
    })
    await database.annotation.insert(highlight)

    await result.current.updateAnnotation.mutateAsync({
      id: highlight._id,
      highlightColor: YELLOW,
      notes: "A note",
    })

    const updated = await database.annotation.findOne(highlight._id).exec()
    expect(updated?.toJSON()).toStrictEqual({
      ...highlight,
      highlightColor: YELLOW,
      notes: "A note",
      modifiedAt: expect.any(String),
    })
    expect(Date.parse(updated?.modifiedAt ?? "")).not.toBeNaN()
  })

  it("remove the document of a deleted annotation", async () => {
    const { database, result } = await renderAnnotationHooksWithDatabase()
    const kept = storedAnnotation({
      bookId: BOOK_ID,
      createdAt: "2026-11-19T10:00:00.000Z",
    })
    const deleted = storedAnnotation({
      bookId: BOOK_ID,
      createdAt: "2026-11-19T11:00:00.000Z",
    })
    await database.annotation.bulkInsert([kept, deleted])

    await result.current.deleteAnnotation.mutateAsync(deleted._id)

    const annotations = await database.annotation.find().exec()
    expect(annotations.map((annotation) => annotation._id)).toEqual([kept._id])
  })
})
