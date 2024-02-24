import { useMemo } from "react"
import { useBooksAsArrayState } from "../books/states"
import { ReadingStateState } from "@oboku/shared"
import { useBooksSortedBy } from "../books/helpers"
import { booksDownloadStateSignal } from "../download/states"
import { useProtectedTagIds } from "../tags/helpers"
import { useSignalValue } from "reactjrx"

/**
 * @todo cleanup
 */
export const useContinueReadingBooks = () => {
  const { data: isPending } = useProtectedTagIds()
  const normalizedBookDownloadsState = useSignalValue(
    booksDownloadStateSignal
  )

  const { data: booksAsArray, isPending: isBooksPending } =
    useBooksAsArrayState({
      normalizedBookDownloadsState,
    })
  const booksSortedByDate = useBooksSortedBy(booksAsArray, "activity")

  return {
    data: useMemo(
      () =>
        booksSortedByDate
          .filter(
            (book) =>
              book.readingStateCurrentState === ReadingStateState.Reading
          )
          .map((item) => item._id),
      [booksSortedByDate]
    ),
    isPending: isPending || isBooksPending
  }
}

/**
 * @todo cleanup
 */
export const useRecentlyAddedBooks = () => {
  const { data: books } = useBooksAsArrayState({
    normalizedBookDownloadsState: useSignalValue(
      booksDownloadStateSignal
    ),
  })

  return useMemo(() => {
    // descend
    const booksSortedByDate = [...books].sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : -1
    )

    return booksSortedByDate.slice(0, 15).map((book) => book._id)
  }, [books])
}
