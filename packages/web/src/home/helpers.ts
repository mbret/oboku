import { useMemo } from "react"
import { useBooksAsArrayState } from "../books/states"
import { ReadingStateState } from "@oboku/shared"
import { useBooksSortedBy } from "../books/helpers"
import { booksDownloadStateSignal } from "../download/states"
import { useProtectedTagIds } from "../tags/helpers"
import { useSignalValue } from "reactjrx"
import { libraryStateSignal } from "../library/states"

/**
 * @todo cleanup
 */
export const useContinueReadingBooks = () => {
  const libraryState = useSignalValue(libraryStateSignal)
  const { data: protectedTagIds, isPending } = useProtectedTagIds()
  const normalizedBookDownloadsState = useSignalValue(
    booksDownloadStateSignal
  )

  const { data: booksAsArray, isPending: isBooksPending } =
    useBooksAsArrayState({
      libraryState,
      normalizedBookDownloadsState,
      protectedTagIds
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
  const libraryState = useSignalValue(libraryStateSignal)
  const { data: books } = useBooksAsArrayState({
    libraryState,
    normalizedBookDownloadsState: useSignalValue(
      booksDownloadStateSignal
    ),
    protectedTagIds: useProtectedTagIds().data
  })

  return useMemo(() => {
    // descend
    const booksSortedByDate = [...books].sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : -1
    )

    return booksSortedByDate.slice(0, 15).map((book) => book._id)
  }, [books])
}
