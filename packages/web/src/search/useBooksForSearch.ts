import { combineLatest, map } from "rxjs"
import { getMetadataFromBook } from "../books/getMetadataFromBook"
import { visibleBooks$ } from "../books/states"
import { REGEXP_SPECIAL_CHAR } from "./states"
import { useQuery } from "reactjrx"
import { sortByTitleComparator } from "@oboku/shared"

export const useBooksForSearch = (search: string) =>
  useQuery({
    queryKey: ["search", "books", search],
    staleTime: 1000,
    queryFn: () =>
      combineLatest([visibleBooks$]).pipe(
        map(([data]) => {
          if (!search) return []

          return data
            .filter((book) => {
              const { title } = getMetadataFromBook(book)
              const searchRegex = new RegExp(
                search.replace(REGEXP_SPECIAL_CHAR, `\\$&`) || "",
                "i"
              )

              const indexOfFirstMatch = title?.search(searchRegex) || 0

              return indexOfFirstMatch >= 0
            })
            .sort((a, b) =>
              sortByTitleComparator(
                getMetadataFromBook(a).title || "",
                getMetadataFromBook(b).title || ""
              )
            )
        }),
        map((items) => items.map(({ _id }) => _id))
      )
  })
