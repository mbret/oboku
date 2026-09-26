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
import { isDefined } from "reactjrx"
import { useEffect } from "react"
import { useIncrementalBookModify } from "../../books"

const SYNC_BOOK_PROGRESS_INTERVAL_MS = 1000

const normalizeProgress = (progress: number) => Number(progress.toFixed(4))

const normalizeReadingPosition = ({
  cfi,
  percentageEstimateOfBook,
}: ReadingPosition): ReadingPosition => ({
  cfi,
  percentageEstimateOfBook: normalizeProgress(percentageEstimateOfBook),
})

const getLatest = <T>(values: T[]) => values[values.length - 1]

const isEndOfBookVisible = ({
  isSettled,
  percentageEstimateOfBook,
}: {
  isSettled: boolean
  percentageEstimateOfBook: number
}) => isSettled && percentageEstimateOfBook === 1

const createReadingPositionPatch =
  ({ cfi, percentageEstimateOfBook }: ReadingPosition) =>
  (old: BookDocType): BookDocType => {
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
      readingStateCurrentBookmarkProgressUpdatedAt: new Date().toISOString(),
      ...(didReadingStateChange && {
        readingStateCurrentState: nextReadingState,
      }),
      ...(didProgressChange && {
        readingStateCurrentBookmarkProgressPercent: percentageEstimateOfBook,
      }),
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
    readingStateCurrentBookmarkProgressUpdatedAt: new Date().toISOString(),
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
      // completes the reading position stream downstream, which lets
      // bufferTime flush any buffered value and run one last write before
      // teardown.
      const unmount$ = new Subject<void>()

      // bufferTime is preferred over auditTime because it flushes its
      // pending buffer on source completion, guaranteeing the latest
      // reading position is written when the hook unmounts.
      const readingPositionPatch$ = reader.navigation.readingPosition$.pipe(
        map(normalizeReadingPosition),
        distinctUntilChanged(isShallowEqual),
        takeUntil(unmount$),
        bufferTime(SYNC_BOOK_PROGRESS_INTERVAL_MS),
        map(getLatest),
        filter(isDefined),
        map(createReadingPositionPatch),
      )

      const endOfBookPatch$ = reader.pagination.state$.pipe(
        filter(isEndOfBookVisible),
        map(function toFinishedPatch() {
          return markBookAsFinished
        }),
      )

      const sub = merge(readingPositionPatch$, endOfBookPatch$)
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
        // Complete the source synchronously so bufferTime can flush its
        // pending value and the final mutation is dispatched before we
        // tear down the subscription.
        unmount$.next()
        unmount$.complete()
        sub.unsubscribe()
      }
    },
    [reader, bookId, incrementalBookModify, enabled],
  )
}
