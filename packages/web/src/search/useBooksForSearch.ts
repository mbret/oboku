import { getMetadataFromBook } from "../books/getMetadataFromBook"
import { REGEXP_SPECIAL_CHAR } from "./useCollectionsForSearch"
import { sortByTitleComparator } from "@oboku/shared"
import { useVisibleBooks } from "../books/useVisibleBooks"
import { useMemo } from "react"
import { useSignalValue } from "reactjrx"
import { searchListActionsToolbarSignal } from "./list/states"

export const useBooksForSearch = (search: string) => {
  const { notInterestedContents } = useSignalValue(
    searchListActionsToolbarSignal
  )

  const { data: visibleBooks } = useVisibleBooks({
    isNotInterested: notInterestedContents
  })

  const filteredBooks = useMemo(
    () =>
      visibleBooks
        ?.filter((book) => {
          return book.metadata?.some(({ title }) => {
            if (!title) return false

            const searchRegex = new RegExp(
              search.replace(REGEXP_SPECIAL_CHAR, `\\$&`) || "",
              "i"
            )

            const indexOfFirstMatch = title?.search(searchRegex) || 0

            return indexOfFirstMatch >= 0
          })
        })
        .sort((a, b) =>
          sortByTitleComparator(
            getMetadataFromBook(a).title || "",
            getMetadataFromBook(b).title || ""
          )
        )
        .map((item) => item._id),
    [search, visibleBooks]
  )

  return { data: filteredBooks }
}
