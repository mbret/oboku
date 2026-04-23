import { ReadingStateState } from "@oboku/shared"
import { useMutation$ } from "reactjrx"
import { from, mergeMap, toArray } from "rxjs"
import { getLatestDatabase } from "../rxdb/RxDbProvider"

const createMarkBookAsUnreadPatch = () => ({
  readingStateCurrentState: ReadingStateState.NotStarted,
  readingStateCurrentBookmarkProgressPercent: 0,
  readingStateCurrentBookmarkProgressUpdatedAt: new Date().toISOString(),
  readingStateCurrentBookmarkLocation: null,
})

const createMarkBookAsFinishedPatch = () => ({
  readingStateCurrentState: ReadingStateState.Finished,
  readingStateCurrentBookmarkProgressPercent: 1,
  readingStateCurrentBookmarkProgressUpdatedAt: new Date().toISOString(),
  readingStateCurrentBookmarkLocation: null,
})

type UseMarkBooksAsOptions = {
  onSuccess?: () => void
  onSettled?: () => void
}

function useMarkBooksAs(
  createPatch: typeof createMarkBookAsUnreadPatch,
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
            mergeMap((book) => from(book.incrementalPatch(createPatch()))),
            toArray(),
          ),
        ),
      ),
    ...options,
  })
}

export const useMarkBooksAsUnread = (options: UseMarkBooksAsOptions = {}) =>
  useMarkBooksAs(createMarkBookAsUnreadPatch, options)

export const useMarkBooksAsFinished = (options: UseMarkBooksAsOptions = {}) =>
  useMarkBooksAs(createMarkBookAsFinishedPatch, options)
