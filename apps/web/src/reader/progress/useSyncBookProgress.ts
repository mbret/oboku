import { useReader } from "../states"
import { ReadingStateState } from "@oboku/shared"
import {
  bufferTime,
  catchError,
  combineLatest,
  concatMap,
  distinctUntilChanged,
  EMPTY,
  filter,
  from,
  map,
  merge,
  share,
  startWith,
  Subject,
  switchMap,
  takeUntil,
} from "rxjs"
import { isShallowEqual } from "@prose-reader/core"
import { useEffect } from "react"
import { useIncrementalBookModify } from "../../books"

const SYNC_BOOK_PROGRESS_INTERVAL_MS = 1000

const normalizeProgress = (progress: number) => Number(progress.toFixed(4))

export const useSyncBookProgress = (
  bookId: string,
  { enabled = true }: { enabled?: boolean } = {},
) => {
  const reader = useReader()
  const { mutateAsync: incrementalBookModify } = useIncrementalBookModify()

  useEffect(() => {
    if (!enabled) return
    if (!reader) return

    // Signals that the hook is unmounting. When it emits, takeUntil()
    // completes the progress stream downstream, which lets bufferTime
    // flush any buffered value and run one last write before teardown.
    const unmount$ = new Subject<void>()

    const settledPercentageEstimateOfBook$ = reader.pagination.state$.pipe(
      filter((pagination) => pagination.isSettled),
      map((pagination) =>
        normalizeProgress(pagination.percentageEstimateOfBook),
      ),
    )

    const bookProgress$ = combineLatest([
      reader.navigation.readingPosition$,
      settledPercentageEstimateOfBook$,
    ]).pipe(
      map(([readingPosition, percentageEstimateOfBook]) => ({
        readingPosition,
        percentageEstimateOfBook,
      })),
      distinctUntilChanged(isShallowEqual),
      takeUntil(unmount$),
      share(),
    )

    const finished$ = bookProgress$.pipe(
      filter((data) => data.percentageEstimateOfBook === 1),
    )

    // Reset the throttling window whenever a finished event fires so the
    // value buffered before reaching the last page is discarded instead
    // of emitting ~1s later and regressing the stored progress. After
    // the reset, future non-finished updates (e.g. the user navigates
    // back) continue to be throttled normally.
    //
    // bufferTime is preferred over auditTime because it flushes its
    // pending buffer on source completion, guaranteeing the latest
    // progress is written when the hook unmounts.
    const throttledProgress$ = finished$.pipe(
      startWith(null),
      switchMap(() =>
        bookProgress$.pipe(
          filter((data) => data.percentageEstimateOfBook !== 1),
          bufferTime(SYNC_BOOK_PROGRESS_INTERVAL_MS),
          map((values) => values[values.length - 1]),
          filter((value) => value !== undefined),
        ),
      ),
    )

    const sub = merge(throttledProgress$, finished$)
      .pipe(
        concatMap((params) => {
          const promise = incrementalBookModify({
            doc: bookId,
            mutationFn: (old) => {
              const nextReadingState =
                old.readingStateCurrentState === ReadingStateState.Finished
                  ? ReadingStateState.Finished
                  : params.percentageEstimateOfBook === 1
                    ? ReadingStateState.Finished
                    : ReadingStateState.Reading

              const didBookmarkLocationChange =
                old.readingStateCurrentBookmarkLocation !==
                params.readingPosition
              const didProgressChange =
                old.readingStateCurrentBookmarkProgressPercent !==
                params.percentageEstimateOfBook
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
                  readingStateCurrentBookmarkLocation: params.readingPosition,
                }),
                readingStateCurrentBookmarkProgressUpdatedAt:
                  new Date().toISOString(),
                ...(didReadingStateChange && {
                  readingStateCurrentState: nextReadingState,
                }),
                ...(didProgressChange && {
                  readingStateCurrentBookmarkProgressPercent:
                    params.percentageEstimateOfBook,
                }),
              }
            },
          })

          return from(promise)
        }),
        catchError((error) => {
          console.error(error)

          return EMPTY
        }),
      )
      .subscribe()

    return () => {
      // Complete the source synchronously so bufferTime can flush its
      // pending value and the final mutation is dispatched before we
      // tear down the subscription.
      unmount$.next()
      unmount$.complete()
      sub.unsubscribe()
    }
  }, [reader, bookId, incrementalBookModify, enabled])
}
