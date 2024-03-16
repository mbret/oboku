import { useMemo } from "react"
import { ReadingStateState } from "@oboku/shared"
import { useBooksSortedBy } from "../books/helpers"
import { useProtectedTagIds } from "../tags/helpers"
import { useVisibleBooks } from "../books/useVisibleBooks"

export const useContinueReadingBooks = () => {
  const { isPending } = useProtectedTagIds()

  const { data: booksAsArray, isLoading: isBooksPending } = useVisibleBooks({
    queryObj: {
      selector: {
        isNotInterested: {
          $ne: true
        }
      }
    }
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

export const useRecentlyAddedBooks = () => {
  const { data: booksAsArray } = useVisibleBooks({
    queryObj: {
      selector: {
        isNotInterested: {
          $ne: true
        }
      }
    }
  })

  return useMemo(() => {
    // descend
    const booksSortedByDate = [...(booksAsArray ?? [])].sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : -1
    )

    return booksSortedByDate.slice(0, 15).map((book) => book._id)
  }, [booksAsArray])
}
