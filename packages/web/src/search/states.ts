import { sortByTitleComparator } from "@oboku/shared"
import { combineLatest, first, map, switchMap } from "rxjs"
import { latestDatabase$ } from "../rxdb/useCreateDatabase"
import { signal, useQuery } from "reactjrx"
import { getMetadataFromCollection } from "../collections/getMetadataFromCollection"

export const searchStateSignal = signal({
  key: "searchState",
  default: ""
})

export const REGEXP_SPECIAL_CHAR =
  /[\!\#\$\%\^\&\*\)\(\+\=\.\<\>\{\}\[\]\:\;\'\"\|\~\`\_\-]/g

export const useCollectionsForSearch = (search: string) =>
  useQuery({
    queryKey: ["search", "collections", search],
    staleTime: 1000,
    queryFn: () =>
      combineLatest([
        latestDatabase$.pipe(
          switchMap(
            (database) => database.collections.obokucollection.find().$
          ),
          first()
        )
      ]).pipe(
        map(([data]) => {
          if (!search) return []

          return data
            .filter((item) => {
              const name = getMetadataFromCollection(item).title ?? ""

              const searchRegex = new RegExp(
                search.replace(REGEXP_SPECIAL_CHAR, `\\$&`) || "",
                "i"
              )

              const indexOfFirstMatch = name?.search(searchRegex) || 0
              return indexOfFirstMatch >= 0
            })
            .sort((a, b) =>
              sortByTitleComparator(
                getMetadataFromCollection(a).title || "",
                getMetadataFromCollection(b).title || ""
              )
            )
        }),
        map((items) => items.map(({ _id }) => _id))
      )
  })
