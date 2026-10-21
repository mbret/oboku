import { useMemo } from "react"
import { useBooksSortedBy } from "../books/helpers"
import { useBooks } from "../books/states"

export const useRecentlyAddedBooks = () => {
  const { data: booksAsArray } = useBooks({
    isNotInterested: "none",
  })
  const booksSortedByDate = useBooksSortedBy(booksAsArray, "date")

  return useMemo(
    function computeRecentlyAddedBookIds() {
      return booksSortedByDate.slice(0, 15).map((book) => book._id)
    },
    [booksSortedByDate],
  )
}
