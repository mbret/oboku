import { useMemo } from "react"
import { useBooks } from "../books/states"

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
