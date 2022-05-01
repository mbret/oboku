import { useMemo } from "react"
import * as R from "ramda"
import { useRecoilValue } from "recoil"
import { booksAsArrayState } from "../books/states"
import { ReadingStateState } from "@oboku/shared"
import { useBooksSortedBy } from "../books/helpers"

export const useContinueReadingBooks = () => {
  const booksAsArray = useRecoilValue(booksAsArrayState)
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
  const books = useRecoilValue(booksAsArrayState)

  return useMemo(() => {
    const booksSortedByDate = R.sort(R.descend(R.prop("createdAt")), books)

    return booksSortedByDate.slice(0, 15).map((book) => book._id)
  }, [books])
}
