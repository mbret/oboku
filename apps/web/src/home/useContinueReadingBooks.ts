import { useMemo } from "react"
import { ReadingStateState } from "@oboku/shared"
import { useBooksSortedBy } from "../books/helpers"
import { useProtectedTagIds } from "../tags/helpers"
import { useBooks } from "../books/states"

export const useContinueReadingBooks = () => {
  const { isPending } = useProtectedTagIds()

  const { data: booksAsArray, isLoading: isBooksPending } = useBooks({
    isNotInterested: "none",
  })
  const booksSortedByDate = useBooksSortedBy(booksAsArray, "activity")

  return {
    data: useMemo(
      () =>
        booksSortedByDate
          .filter(
            (book) =>
              book.readingStateCurrentState === ReadingStateState.Reading,
          )
          .map((item) => item._id),
      [booksSortedByDate],
    ),
    isPending: isPending || isBooksPending,
  }
}
