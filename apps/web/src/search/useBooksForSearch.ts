import { getMetadataFromBook } from "../books/metadata"
import { sortBooksBy } from "../books/helpers"
import { REGEXP_SPECIAL_CHAR } from "./useCollectionsForSearch"
import { useMemo } from "react"
import { useSignalValue } from "reactjrx"
import { searchListActionsToolbarSignal } from "./list/states"
import { useBooks } from "../books/states"

export const useBooksForSearch = (search: string) => {
  const { notInterestedContents } = useSignalValue(
    searchListActionsToolbarSignal,
  )

  const { data: visibleBooks } = useBooks({
    isNotInterested: notInterestedContents,
  })

  const filteredBooks = useMemo(() => {
    const searchRegex = new RegExp(
      search.replace(REGEXP_SPECIAL_CHAR, `\\$&`) || "",
      "i",
    )

    const matchingBooks = (visibleBooks ?? []).filter((book) => {
      const metadata = book.metadata?.length
        ? book.metadata
        : [getMetadataFromBook(book)]

      return metadata?.some((item) => {
        const { title } = item

        if (!title) return false

        const indexOfFirstMatch = title?.toString()?.search(searchRegex) || 0

        return indexOfFirstMatch >= 0
      })
    })

    return sortBooksBy(matchingBooks, "alpha").map((book) => book._id)
  }, [search, visibleBooks])

  return { data: filteredBooks }
}
