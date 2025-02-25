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

export const useRecentlyAddedBooks = () => {
  const { data: booksAsArray } = useBooks({
    isNotInterested: "none",
  })

  return useMemo(() => {
    // descend
    const booksSortedByDate = [...(booksAsArray ?? [])].sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : -1,
    )

    return booksSortedByDate.slice(0, 15).map((book) => book._id)
  }, [booksAsArray])
}
