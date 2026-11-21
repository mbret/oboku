import type { Annotation } from "@prose-reader/enhancer-annotations"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { firstValueFrom } from "rxjs"
import { describe, expect, it, onTestFinished, vi } from "vitest"
import { useReaderAnnotations } from "../reader/annotations/useReaderAnnotations"
import type { Database } from "../rxdb"
import type { RxdbAnnotationDocType } from "../rxdb/collections/annotation"
import { getLatestDatabase, useReCreateDb } from "../rxdb/RxDbProvider"
import { useAnnotations } from "./useAnnotations"
import { useWriteAnnotation } from "./useWriteAnnotation"

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

/**
 * Controls the next inserts of the annotation collection, one call per
 * insert, in order.
 */
const controlInserts = (database: Database) => {
  const insert = database.annotation.insert.bind(database.annotation)
  const insertSpy = vi.spyOn(database.annotation, "insert")

  return {
    holdNext: function holdNextInsert() {
      const heldInsert = Promise.withResolvers<void>()

      insertSpy.mockImplementationOnce(
        async function insertOnceReleased(document) {
          await heldInsert.promise

          return insert(document)
        },
      )

      return heldInsert
    },
    holdNextResult: function holdNextInsertResult() {
      const heldResult = Promise.withResolvers<void>()

      insertSpy.mockImplementationOnce(
        async function insertThenHoldResult(document) {
          const inserted = await insert(document)
          await heldResult.promise

          return inserted
        },
      )

      return heldResult
    },
    failNext: function failNextInsert() {
      const heldFailure = Promise.withResolvers<void>()

      insertSpy.mockImplementationOnce(async function failOnceReleased() {
        await heldFailure.promise

        throw new Error("The write failed")
      })

      return heldFailure
    },
  }
}

const idsOf = (annotations: { id: string }[] | undefined) =>
  annotations?.map((annotation) => annotation.id)

async function renderAnnotationHooksWithDatabase({
  enabled = true,
  onReaderAnnotations,
}: {
  enabled?: boolean
  onReaderAnnotations?: (annotations: Annotation[] | undefined) => void
} = {}) {
  const queryClient = new QueryClient()
  const { result, unmount } = renderHook(
    function renderAnnotationHooks() {
      const reader = useReaderAnnotations({ bookId: BOOK_ID, enabled })

      onReaderAnnotations?.(reader.annotations)

      return {
        reCreateDb: useReCreateDb(),
        annotations: useAnnotations({ bookId: BOOK_ID, enabled }),
        reader,
        writeAnnotation: useWriteAnnotation({ bookId: BOOK_ID }),
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

    await result.current.writeAnnotation.mutateAsync({
      type: "create",
      annotation: {
        id: highlightId,
        cfi: HIGHLIGHT_CFI,
        highlightedText: "Call me Ishmael",
        highlightColor: PURPLE,
        notes: "A note",
      },
    })
    await result.current.writeAnnotation.mutateAsync({
      type: "create",
      annotation: {
        id: bookmarkId,
        cfi: BOOKMARK_CFI,
      },
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

    await result.current.writeAnnotation.mutateAsync({
      type: "create",
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

    await result.current.writeAnnotation.mutateAsync({
      type: "update",
      annotation: {
        id: highlight._id,
        highlightColor: YELLOW,
        notes: "A note",
      },
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

  it("remove the document of a removed annotation", async () => {
    const { database, result } = await renderAnnotationHooksWithDatabase()
    const kept = storedAnnotation({
      bookId: BOOK_ID,
      createdAt: "2026-11-19T10:00:00.000Z",
    })
    const removed = storedAnnotation({
      bookId: BOOK_ID,
      createdAt: "2026-11-19T11:00:00.000Z",
    })
    await database.annotation.bulkInsert([kept, removed])

    await result.current.writeAnnotation.mutateAsync({
      type: "remove",
      id: removed._id,
    })

    const annotations = await database.annotation.find().exec()
    expect(annotations.map((annotation) => annotation._id)).toEqual([kept._id])
  })

  it("change nothing for an annotation that another device already removed", async () => {
    const { database, result } = await renderAnnotationHooksWithDatabase()
    const kept = await database.annotation.insert(
      storedAnnotation({
        bookId: BOOK_ID,
        createdAt: "2026-11-19T10:00:00.000Z",
      }),
    )
    const gone = await database.annotation.insert(
      storedAnnotation({
        bookId: BOOK_ID,
        createdAt: "2026-11-19T11:00:00.000Z",
      }),
    )
    const goneId = gone._id
    await gone.incrementalRemove()

    await result.current.writeAnnotation.mutateAsync({
      type: "update",
      annotation: {
        id: goneId,
        highlightColor: YELLOW,
        notes: "A note",
      },
    })
    await result.current.writeAnnotation.mutateAsync({
      type: "remove",
      id: goneId,
    })

    const annotations = await database.annotation.find().exec()
    expect(annotations.map((annotation) => annotation.toJSON())).toStrictEqual([
      kept.toJSON(),
    ])
  })
  it("show a write at once, while it runs, then the stored list once it lands", async () => {
    const { database, result } = await renderAnnotationHooksWithDatabase()
    await waitFor(function expectEmptyList() {
      expect(result.current.reader.annotations).toEqual([])
    })
    const heldInsert = controlInserts(database).holdNext()
    const bookmarkId = crypto.randomUUID()

    const creation = result.current.writeAnnotation.mutateAsync({
      type: "create",
      annotation: { id: bookmarkId, cfi: BOOKMARK_CFI },
    })

    await waitFor(function expectBookmarkShown() {
      expect(idsOf(result.current.reader.annotations)).toEqual([bookmarkId])
    })
    expect(await database.annotation.findOne(bookmarkId).exec()).toBeNull()

    heldInsert.resolve()
    await creation

    await waitFor(function expectStoredListShown() {
      expect(idsOf(result.current.annotations.data)).toEqual([bookmarkId])
      expect(result.current.reader.annotations).toBe(
        result.current.annotations.data,
      )
    })
  })

  it("show a write once when the stored list holds it before the call ends", async () => {
    const { database, result } = await renderAnnotationHooksWithDatabase()
    await waitFor(function expectEmptyList() {
      expect(result.current.reader.annotations).toEqual([])
    })
    const heldResult = controlInserts(database).holdNextResult()
    const bookmarkId = crypto.randomUUID()

    const creation = result.current.writeAnnotation.mutateAsync({
      type: "create",
      annotation: { id: bookmarkId, cfi: BOOKMARK_CFI },
    })
    await waitFor(function expectBookmarkStored() {
      expect(idsOf(result.current.annotations.data)).toEqual([bookmarkId])
    })

    expect(result.current.reader.annotations).toBe(
      result.current.annotations.data,
    )

    heldResult.resolve()
    await creation
  })

  it("apply a queued update to the annotation it changes", async () => {
    const { database, result } = await renderAnnotationHooksWithDatabase()
    await waitFor(function expectEmptyList() {
      expect(result.current.reader.annotations).toEqual([])
    })
    const heldInsert = controlInserts(database).holdNext()
    const highlightId = crypto.randomUUID()

    const creation = result.current.writeAnnotation.mutateAsync({
      type: "create",
      annotation: {
        id: highlightId,
        cfi: HIGHLIGHT_CFI,
        highlightColor: PURPLE,
        notes: "",
      },
    })
    const update = result.current.writeAnnotation.mutateAsync({
      type: "update",
      annotation: { id: highlightId, highlightColor: YELLOW, notes: "A note" },
    })

    await waitFor(function expectUpdatedHighlightShown() {
      expect(result.current.reader.annotations).toMatchObject([
        { id: highlightId, highlightColor: YELLOW, notes: "A note" },
      ])
    })

    heldInsert.resolve()
    await Promise.all([creation, update])
  })

  it("show a queued update as it will be stored, a missing field cleared", async () => {
    const { database, result } = await renderAnnotationHooksWithDatabase()
    await waitFor(function expectEmptyList() {
      expect(result.current.reader.annotations).toEqual([])
    })
    const heldInsert = controlInserts(database).holdNext()
    const highlightId = crypto.randomUUID()

    const creation = result.current.writeAnnotation.mutateAsync({
      type: "create",
      annotation: {
        id: highlightId,
        cfi: HIGHLIGHT_CFI,
        highlightColor: PURPLE,
      },
    })
    const update = result.current.writeAnnotation.mutateAsync({
      type: "update",
      annotation: { id: highlightId, notes: "A note" },
    })
    await waitFor(function expectUpdateShown() {
      expect(result.current.reader.annotations).toMatchObject([
        { id: highlightId, highlightColor: undefined, notes: "A note" },
      ])
    })

    heldInsert.resolve()
    await Promise.all([creation, update])

    const stored = await database.annotation.findOne(highlightId).exec()
    expect(stored?.highlightColor).toBeNull()
  })

  it("keep showing a queued write while an earlier one lands", async () => {
    const { database, result } = await renderAnnotationHooksWithDatabase()
    await waitFor(function expectEmptyList() {
      expect(result.current.reader.annotations).toEqual([])
    })
    const inserts = controlInserts(database)
    const firstInsert = inserts.holdNext()
    const secondInsert = inserts.holdNext()
    const firstId = crypto.randomUUID()
    const secondId = crypto.randomUUID()

    const firstCreation = result.current.writeAnnotation.mutateAsync({
      type: "create",
      annotation: { id: firstId, cfi: BOOKMARK_CFI },
    })
    const secondCreation = result.current.writeAnnotation.mutateAsync({
      type: "create",
      annotation: { id: secondId, cfi: HIGHLIGHT_CFI },
    })
    await waitFor(function expectBothShown() {
      expect(idsOf(result.current.reader.annotations)).toEqual([
        firstId,
        secondId,
      ])
    })

    firstInsert.resolve()
    await firstCreation
    await waitFor(function expectFirstStored() {
      expect(idsOf(result.current.annotations.data)).toEqual([firstId])
    })

    expect(idsOf(result.current.reader.annotations)).toEqual([
      firstId,
      secondId,
    ])

    secondInsert.resolve()
    await secondCreation
  })

  it("show the stored list again when the writes fail", async () => {
    const { database, result } = await renderAnnotationHooksWithDatabase()
    const stored = await database.annotation.insert(
      storedAnnotation({
        bookId: BOOK_ID,
        createdAt: "2026-11-19T10:00:00.000Z",
      }),
    )
    const storedList = await waitFor(function getStoredList() {
      expect(idsOf(result.current.reader.annotations)).toEqual([stored._id])

      return result.current.annotations.data
    })
    const inserts = controlInserts(database)
    const firstFailure = inserts.failNext()
    const secondFailure = inserts.failNext()
    const firstId = crypto.randomUUID()
    const secondId = crypto.randomUUID()

    const firstCreation = result.current.writeAnnotation.mutateAsync({
      type: "create",
      annotation: { id: firstId, cfi: BOOKMARK_CFI },
    })
    const secondCreation = result.current.writeAnnotation.mutateAsync({
      type: "create",
      annotation: { id: secondId, cfi: HIGHLIGHT_CFI },
    })
    await waitFor(function expectBothShown() {
      expect(idsOf(result.current.reader.annotations)).toEqual([
        stored._id,
        firstId,
        secondId,
      ])
    })

    firstFailure.resolve()
    await expect(firstCreation).rejects.toThrow("The write failed")
    await waitFor(function expectOnlySecondPending() {
      expect(idsOf(result.current.reader.annotations)).toEqual([
        stored._id,
        secondId,
      ])
    })

    secondFailure.resolve()
    await expect(secondCreation).rejects.toThrow("The write failed")
    await waitFor(function expectStoredList() {
      expect(result.current.reader.annotations).toBe(storedList)
    })
  })

  it("run the writes of a book in the order of the calls", async () => {
    const { database, result } = await renderAnnotationHooksWithDatabase()
    await waitFor(function expectEmptyList() {
      expect(result.current.reader.annotations).toEqual([])
    })
    const heldInsert = controlInserts(database).holdNext()
    const bookmarkId = crypto.randomUUID()

    const creation = result.current.writeAnnotation.mutateAsync({
      type: "create",
      annotation: { id: bookmarkId, cfi: BOOKMARK_CFI },
    })
    await waitFor(function expectBookmarkShown() {
      expect(idsOf(result.current.reader.annotations)).toEqual([bookmarkId])
    })
    const removal = result.current.writeAnnotation.mutateAsync({
      type: "remove",
      id: bookmarkId,
    })
    await waitFor(function expectBookmarkGone() {
      expect(result.current.reader.annotations).toEqual([])
    })

    heldInsert.resolve()
    await Promise.all([creation, removal])

    expect(await database.annotation.findOne(bookmarkId).exec()).toBeNull()
  })

  it("never show a landed write's annotation in its earlier state", async () => {
    const onReaderAnnotations =
      vi.fn<(annotations: Annotation[] | undefined) => void>()
    const { result } = await renderAnnotationHooksWithDatabase({
      onReaderAnnotations,
    })
    await waitFor(function expectEmptyList() {
      expect(result.current.reader.annotations).toEqual([])
    })
    const highlightId = crypto.randomUUID()
    const highlightInListsRendered = (from: number, to?: number) =>
      onReaderAnnotations.mock.calls
        .slice(from, to)
        .map(([annotations]) =>
          annotations?.find((annotation) => annotation.id === highlightId),
        )

    const beforeCreation = onReaderAnnotations.mock.calls.length
    await result.current.writeAnnotation.mutateAsync({
      type: "create",
      annotation: {
        id: highlightId,
        cfi: HIGHLIGHT_CFI,
        highlightColor: PURPLE,
        notes: "",
      },
    })
    const beforeUpdate = onReaderAnnotations.mock.calls.length
    await result.current.writeAnnotation.mutateAsync({
      type: "update",
      annotation: { id: highlightId, highlightColor: YELLOW, notes: "" },
    })
    const beforeRemoval = onReaderAnnotations.mock.calls.length
    await result.current.writeAnnotation.mutateAsync({
      type: "remove",
      id: highlightId,
    })
    await waitFor(function expectRemovalStored() {
      expect(result.current.annotations.data).toEqual([])
    })

    const created = highlightInListsRendered(beforeCreation, beforeRemoval)
    const firstCreated = created.findIndex(Boolean)
    expect(firstCreated).toBeGreaterThanOrEqual(0)
    expect(created.slice(firstCreated)).not.toContain(undefined)

    const colors = highlightInListsRendered(beforeUpdate, beforeRemoval).map(
      (highlight) => highlight?.highlightColor,
    )
    const firstYellow = colors.indexOf(YELLOW)
    expect(firstYellow).toBeGreaterThanOrEqual(0)
    expect(colors.slice(firstYellow)).not.toContain(PURPLE)

    const removed = highlightInListsRendered(beforeRemoval)
    const firstRemoved = removed.indexOf(undefined)
    expect(firstRemoved).toBeGreaterThanOrEqual(0)
    expect(removed.slice(firstRemoved).filter(Boolean)).toEqual([])
  })
})
