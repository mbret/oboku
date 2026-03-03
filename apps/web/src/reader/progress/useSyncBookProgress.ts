import { useReader } from "../states"
import { ReadingStateState } from "@oboku/shared"
import { useSubscribe } from "reactjrx"
import {
  auditTime,
  catchError,
  concatMap,
  distinctUntilChanged,
  EMPTY,
  filter,
  from,
  map,
  merge,
  share,
  skip,
} from "rxjs"
import { isShallowEqual, mapKeysTo } from "@prose-reader/core"
import { useCallback } from "react"
import { useIncrementalBookModify } from "../../books"

const SYNC_BOOK_PROGRESS_INTERVAL_MS = 1000

const normalizeProgress = (progress: number | undefined) => {
  if (typeof progress !== "number") {
    return undefined
  }

  return Number(progress.toFixed(4))
}

export const useSyncBookProgress = (bookId: string) => {
  const reader = useReader()
  const { mutateAsync: incrementalBookModify } = useIncrementalBookModify()

  const syncBookProgress = useCallback(() => {
    if (!reader) return EMPTY

    const bookProgress$ = reader.pagination.state$.pipe(
      // skip initial state
      skip(1),
      mapKeysTo(["beginCfi", "percentageEstimateOfBook"]),
      map((value) => ({
        ...value,
        percentageEstimateOfBook: normalizeProgress(
          value.percentageEstimateOfBook,
        ),
      })),
      distinctUntilChanged(isShallowEqual),
      share(),
    )

    const syncOnInterval$ = bookProgress$.pipe(
      filter((data) => data.percentageEstimateOfBook !== 1),
      auditTime(SYNC_BOOK_PROGRESS_INTERVAL_MS),
    )

    const syncWhenFinished$ = bookProgress$.pipe(
      filter((data) => data.percentageEstimateOfBook === 1),
    )

    return merge(syncOnInterval$, syncWhenFinished$).pipe(
      concatMap((params) => {
        const promise = incrementalBookModify({
          doc: bookId,
          mutationFn: (old) => {
            const hasBookmarkLocation = Boolean(params.beginCfi)
            const hasProgress =
              typeof params.percentageEstimateOfBook === "number"
            const nextReadingState =
              old.readingStateCurrentState === ReadingStateState.Finished
                ? ReadingStateState.Finished
                : params.percentageEstimateOfBook === 1
                  ? ReadingStateState.Finished
                  : ReadingStateState.Reading

            const didBookmarkLocationChange =
              hasBookmarkLocation &&
              old.readingStateCurrentBookmarkLocation !== params.beginCfi
            const didProgressChange =
              hasProgress &&
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
              // cfi will be undefined at the beginning until pagination stabilize
              ...(didBookmarkLocationChange && {
                readingStateCurrentBookmarkLocation: params.beginCfi || null,
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
  }, [incrementalBookModify, reader, bookId])

  useSubscribe(syncBookProgress)
}
