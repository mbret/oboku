import { useMemo } from "react"
import { useBooksAsArrayState } from "../books/states"
import { ReadingStateState } from "@oboku/shared"
import { useBooksSortedBy } from "../books/helpers"
import { normalizedBookDownloadsStateSignal } from "../download/states"
import { useProtectedTagIds } from "../tags/helpers"
import { useSignalValue } from "reactjrx"
import { libraryStateSignal } from "../library/states"

export const useContinueReadingBooks = () => {
  const libraryState = useSignalValue(libraryStateSignal)
  const booksAsArray = useBooksAsArrayState({
    libraryState,
    normalizedBookDownloadsState: useSignalValue(
      normalizedBookDownloadsStateSignal
    ),
    protectedTagIds: useProtectedTagIds().data
  })
  const booksSortedByDate = useBooksSortedBy(booksAsArray, "activity")

  return useMemo(
    () =>
      booksSortedByDate
        .filter(
          (book) => book.readingStateCurrentState === ReadingStateState.Reading
        )
        .map((item) => item._id),
    [booksSortedByDate]
  )
}

export const useRecentlyAddedBooks = () => {
  const libraryState = useSignalValue(libraryStateSignal)
  const books = useBooksAsArrayState({
    libraryState,
    normalizedBookDownloadsState: useSignalValue(
      normalizedBookDownloadsStateSignal
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
