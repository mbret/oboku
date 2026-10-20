import { getMetadataFromBook } from "../books/metadata"
import { getBookMetadataEntryFields } from "../books/metadata/fields"
import { REGEXP_SPECIAL_CHAR } from "./useCollectionsForSearch"
import { sortByTitleComparator } from "@oboku/shared"
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

    return (visibleBooks ?? [])
      .filter((book) => {
        const titles = book.metadata?.length
          ? book.metadata.map(
              (entry) => getBookMetadataEntryFields(entry).title,
            )
          : [getMetadataFromBook(book).title]

        return titles.some(function titleMatchesSearch(title) {
          if (!title) return false

          const indexOfFirstMatch = title.toString().search(searchRegex) || 0

          return indexOfFirstMatch >= 0
        })
      })
      .map((book) => ({
        book,
        title: getMetadataFromBook(book).title?.toString() ?? "",
      }))
      .sort((a, b) => sortByTitleComparator(a.title, b.title))
      .map(({ book }) => book._id)
  }, [search, visibleBooks])

  return { data: filteredBooks }
}
