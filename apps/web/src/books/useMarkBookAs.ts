import {
  type BookDocType,
  emptyBookmark,
  ReadingStateState,
} from "@oboku/shared"
import { useMutation$ } from "reactjrx"
import { from, mergeMap, toArray } from "rxjs"
import { getLatestDatabase } from "../rxdb/RxDbProvider"

type MarkedReadingState = Pick<
  BookDocType,
  "readingStateCurrentState" | "readingStateReachedProgressPercent"
>

const unread: MarkedReadingState = {
  readingStateCurrentState: ReadingStateState.NotStarted,
  readingStateReachedProgressPercent: 0,
}

const finished: MarkedReadingState = {
  readingStateCurrentState: ReadingStateState.Finished,
  readingStateReachedProgressPercent: 1,
}

const createMarkBookAsPatch = (markedReadingState: MarkedReadingState) => ({
  ...emptyBookmark,
  ...markedReadingState,
  readingStateUpdatedAt: new Date().toISOString(),
})

type UseMarkBooksAsOptions = {
  onSuccess?: () => void
  onSettled?: () => void
}

function useMarkBooksAs(
  markedReadingState: MarkedReadingState,
  options: UseMarkBooksAsOptions = {},
) {
  return useMutation$({
    mutationFn: ({ bookIds }: { bookIds: readonly string[] }) =>
      getLatestDatabase().pipe(
        mergeMap((database) =>
          from(database.book.findByIds(Array.from(bookIds)).exec()),
        ),
        mergeMap((books) =>
          from(Array.from(books.values())).pipe(
            mergeMap((book) =>
              from(
                book.incrementalPatch(
                  createMarkBookAsPatch(markedReadingState),
                ),
              ),
            ),
            toArray(),
          ),
        ),
      ),
    ...options,
  })
}

export const useMarkBooksAsUnread = (options: UseMarkBooksAsOptions = {}) =>
  useMarkBooksAs(unread, options)

export const useMarkBooksAsFinished = (options: UseMarkBooksAsOptions = {}) =>
  useMarkBooksAs(finished, options)
