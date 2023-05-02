import { useMemo } from "react"
import * as R from "ramda"
import { useRecoilValue } from "recoil"
import { booksAsArrayState } from "../books/states"
import { ReadingStateState } from "@oboku/shared"
import { useBooksSortedBy } from "../books/helpers"
import { useLibraryState } from "../library/states"
import { useNormalizedBookDownloadsState } from "../download/states"
import { useProtectedTagIds } from "../tags/helpers"

export const useContinueReadingBooks = () => {
  const booksAsArray = useRecoilValue(
    booksAsArrayState({
      libraryState: useLibraryState(),
      normalizedBookDownloadsState: useNormalizedBookDownloadsState(),
      protectedTagIds: useProtectedTagIds().data
    })
  )
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
  const books = useRecoilValue(
    booksAsArrayState({
      libraryState: useLibraryState(),
      normalizedBookDownloadsState: useNormalizedBookDownloadsState(),
      protectedTagIds: useProtectedTagIds().data
    })
  )

  return useMemo(() => {
    const booksSortedByDate = R.sort(R.descend(R.prop("createdAt")), books)

    return booksSortedByDate.slice(0, 15).map((book) => book._id)
  }, [books])
}
