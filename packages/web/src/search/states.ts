import { sortByTitleComparator } from "@oboku/shared"
import { signal } from "reactjrx"
import { getMetadataFromCollection } from "../collections/getMetadataFromCollection"
import {
  useCollectionsWithPrivacy,
} from "../collections/states"
import { useMemo } from "react"

export const searchStateSignal = signal({
  key: "searchState",
  default: ""
})

export const REGEXP_SPECIAL_CHAR =
  /[\!\#\$\%\^\&\*\)\(\+\=\.\<\>\{\}\[\]\:\;\'\"\|\~\`\_\-]/g

export const useCollectionsForSearch = (search: string) => {
  const { data } = useCollectionsWithPrivacy({})

  const filteredList = useMemo(
    () =>
      data
        ?.filter((item) => {
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
        .map((item) => item._id),
    [data, search]
  )

  return { data: filteredList }
}
