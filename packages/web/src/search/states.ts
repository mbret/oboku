import { sortByTitleComparator } from "@oboku/shared"
import { combineLatest, map, switchMap } from "rxjs"
import { visibleBooks$ } from "../books/states"
import { latestDatabase$ } from "../rxdb/useCreateDatabase"
import { signal, useQuery } from "reactjrx"

export const searchStateSignal = signal({
  key: "searchState",
  default: ""
})

export const REGEXP_SPECIAL_CHAR =
  /[\!\#\$\%\^\&\*\)\(\+\=\.\<\>\{\}\[\]\:\;\'\"\|\~\`\_\-]/g

export const useCollectionsForSearch = (search: string) =>
  useQuery({
    queryKey: ["search", "collections", search],
    queryFn: () =>
      combineLatest([
        latestDatabase$.pipe(
          switchMap((database) => database.collections.obokucollection.find().$)
        )
      ]).pipe(
        map(([data]) => {
          if (!search) return []

          return data
            .filter(({ name }) => {
              const searchRegex = new RegExp(
                search.replace(REGEXP_SPECIAL_CHAR, `\\$&`) || "",
                "i"
              )

              const indexOfFirstMatch = name?.search(searchRegex) || 0
              return indexOfFirstMatch >= 0
            })
            .sort((a, b) => sortByTitleComparator(a.name || "", b.name || ""))
        }),
        map((items) => items.map(({ _id }) => _id))
      )
  })

export const useBooksForSearch = (search: string) =>
  useQuery({
    queryKey: ["search", "books", search],
    queryFn: () =>
      combineLatest([visibleBooks$]).pipe(
        map(([data]) => {
          if (!search) return []

          return data
            .filter(({ title }) => {
              const searchRegex = new RegExp(
                search.replace(REGEXP_SPECIAL_CHAR, `\\$&`) || "",
                "i"
              )

              const indexOfFirstMatch = title?.search(searchRegex) || 0

              return indexOfFirstMatch >= 0
            })
            .sort((a, b) => sortByTitleComparator(a.title || "", b.title || ""))
        }),
        map((items) => items.map(({ _id }) => _id))
      )
  })
