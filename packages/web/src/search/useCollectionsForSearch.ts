import { sortByTitleComparator } from "@oboku/shared"
import { getMetadataFromCollection } from "../collections/getMetadataFromCollection"
import { useMemo } from "react"
import { useSignalValue } from "reactjrx"
import { searchListActionsToolbarSignal } from "./list/states"
import { useCollections } from "../collections/useCollections"

export const REGEXP_SPECIAL_CHAR =
  /[\!\#\$\%\^\&\*\)\(\+\=\.\<\>\{\}\[\]\:\;\'\"\|\~\`\_\-]/g

export const useCollectionsForSearch = (search: string) => {
  const { notInterestedContents } = useSignalValue(
    searchListActionsToolbarSignal
  )
  const { data } = useCollections({
    isNotInterested: notInterestedContents
  })

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
