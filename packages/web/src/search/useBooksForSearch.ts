import { getMetadataFromBook } from "../books/getMetadataFromBook"
import { REGEXP_SPECIAL_CHAR } from "./states"
import { sortByTitleComparator } from "@oboku/shared"
import { useVisibleBooks } from "../books/useVisibleBooks"
import { useMemo } from "react"

export const useBooksForSearch = (search: string) => {
  const { data: visibleBooks } = useVisibleBooks()

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

            console.log({ title, indexOfFirstMatch })
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
