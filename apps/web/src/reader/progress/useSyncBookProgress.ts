import { useReader } from "../states"
import { type BookDocType, ReadingStateState } from "@oboku/shared"
import {
  bufferTime,
  catchError,
  concatMap,
  distinctUntilChanged,
  EMPTY,
  filter,
  from,
  map,
  merge,
  Subject,
  takeUntil,
} from "rxjs"
import { isShallowEqual, type ReadingPosition } from "@prose-reader/core"
import { useEffect } from "react"
import { useIncrementalBookModify } from "../../books"

const SYNC_BOOK_PROGRESS_INTERVAL_MS = 1000

const normalizeProgress = (progress: number) => Number(progress.toFixed(4))

type SavedReadingPosition = Pick<
  ReadingPosition,
  "cfi" | "percentageEstimateOfBook"
>

const toSavedReadingPosition = ({
  cfi,
  percentageEstimateOfBook,
}: ReadingPosition): SavedReadingPosition => ({
  cfi,
  percentageEstimateOfBook: normalizeProgress(percentageEstimateOfBook),
})

type PaginationProgress = {
  isSettled: boolean
  percentageEstimateOfBook: number
  end: { spineItemIndex: number | undefined }
}

type BookPatch = (old: BookDocType) => BookDocType

const isSettled = ({ isSettled }: PaginationProgress) => isSettled

const isAtEndOfBook = ({ percentageEstimateOfBook }: PaginationProgress) =>
  percentageEstimateOfBook === 1

const toReachedProgress = ({ percentageEstimateOfBook }: PaginationProgress) =>
  normalizeProgress(percentageEstimateOfBook)

const toPositionProgress = ({ percentageEstimateOfBook }: ReadingPosition) =>
  normalizeProgress(percentageEstimateOfBook)

const hasPatches = (patches: BookPatch[]) => patches.length > 0

const composePatches = (patches: BookPatch[]): BookPatch =>
  function applyPatchesInOrder(old) {
    return patches.reduce((book, patch) => patch(book), old)
  }

const createReadingPositionPatch = ({
  cfi,
  percentageEstimateOfBook,
}: SavedReadingPosition): BookPatch =>
  function applyReadingPosition(old) {
    const nextReadingState =
      old.readingStateCurrentState === ReadingStateState.Finished
        ? ReadingStateState.Finished
        : ReadingStateState.Reading

    const didBookmarkLocationChange =
      old.readingStateCurrentBookmarkLocation !== cfi
    const didProgressChange =
      old.readingStateCurrentBookmarkProgressPercent !==
      percentageEstimateOfBook
    const didReadingStateChange =
      old.readingStateCurrentState !== nextReadingState

    if (
      !didBookmarkLocationChange &&
      !didProgressChange &&
      !didReadingStateChange
    ) {
      return old
    }

    return {
      ...old,
      ...(didBookmarkLocationChange && {
        readingStateCurrentBookmarkLocation: cfi,
      }),
      readingStateUpdatedAt: new Date().toISOString(),
      ...(didReadingStateChange && {
        readingStateCurrentState: nextReadingState,
      }),
      ...(didProgressChange && {
        readingStateCurrentBookmarkProgressPercent: percentageEstimateOfBook,
      }),
    }
  }

const createReachedProgressPatch = (reachedProgress: number): BookPatch =>
  function applyReachedProgress(old) {
    if (old.readingStateReachedProgressPercent === reachedProgress) return old

    return {
      ...old,
      readingStateReachedProgressPercent: reachedProgress,
      readingStateUpdatedAt: new Date().toISOString(),
    }
  }

/**
 * Finished is a reading state, not a progress (see `BookDocType`): the bookmark
 * and its progress stay the reading position's, which is short of 1 on the
 * last page, so a finished book can store 0.9.
 */
const markBookAsFinished = (old: BookDocType): BookDocType => {
  if (old.readingStateCurrentState === ReadingStateState.Finished) return old

  return {
    ...old,
    readingStateCurrentState: ReadingStateState.Finished,
    readingStateUpdatedAt: new Date().toISOString(),
  }
}

export const useSyncBookProgress = (
  bookId: string,
  { enabled = true }: { enabled?: boolean } = {},
) => {
  const reader = useReader()
  const { mutateAsync: incrementalBookModify } = useIncrementalBookModify()

  useEffect(
    function syncBookProgressWhileReading() {
      if (!enabled) return
      if (!reader) return

      // Signals that the hook is unmounting. When it emits, takeUntil()
      // completes the progress streams downstream, which lets bufferTime
      // flush any buffered patch as one last write.
      const unmount$ = new Subject<void>()

      const readingPositionPatch$ = reader.navigation.readingPosition$.pipe(
        map(toSavedReadingPosition),
        distinctUntilChanged(isShallowEqual),
        map(createReadingPositionPatch),
      )

      const isSettledOnLoadedPage = (pagination: PaginationProgress) => {
        const lastVisibleSpineItem = reader.spineItemsManager.get(
          pagination.end.spineItemIndex,
        )
        const didLastVisiblePageFailToLoad =
          lastVisibleSpineItem?.value.isError === true

        return isSettled(pagination) && !didLastVisiblePageFailToLoad
      }

      const progressUntilPaginationSettles$ =
        reader.navigation.readingPosition$.pipe(map(toPositionProgress))

      const progressOncePaginationSettles$ = reader.pagination.state$.pipe(
        filter(isSettledOnLoadedPage),
        map(toReachedProgress),
      )

      const reachedProgressPatch$ = merge(
        progressUntilPaginationSettles$,
        progressOncePaginationSettles$,
      ).pipe(distinctUntilChanged(), map(createReachedProgressPatch))

      // bufferTime is preferred over auditTime because it flushes its
      // pending buffer on source completion, guaranteeing the latest
      // progress is written when the hook unmounts.
      const throttledProgressPatch$ = merge(
        readingPositionPatch$,
        reachedProgressPatch$,
      ).pipe(
        takeUntil(unmount$),
        bufferTime(SYNC_BOOK_PROGRESS_INTERVAL_MS),
        filter(hasPatches),
        map(composePatches),
      )

      const endOfBookPatch$ = reader.pagination.state$.pipe(
        filter(isSettledOnLoadedPage),
        filter(isAtEndOfBook),
        map(function toFinishedPatch() {
          return markBookAsFinished
        }),
        takeUntil(unmount$),
      )

      merge(throttledProgressPatch$, endOfBookPatch$)
        .pipe(
          concatMap(function modifyBook(mutationFn) {
            return from(incrementalBookModify({ doc: bookId, mutationFn }))
          }),
          catchError(function logSyncError(error) {
            console.error(error)

            return EMPTY
          }),
        )
        .subscribe()

      return function flushBookProgressOnUnmount() {
        // Completing the sources rather than unsubscribing lets concatMap
        // run every write still queued, such as the last flush waiting on a
        // finished write in flight. The subscription then ends on its own.
        unmount$.next()
        unmount$.complete()
      }
    },
    [reader, bookId, incrementalBookModify, enabled],
  )
}
