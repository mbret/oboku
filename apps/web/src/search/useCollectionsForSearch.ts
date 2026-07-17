import { sortByTitleComparator } from "@oboku/shared"
import { getCollectionComputedMetadata } from "../collections/getCollectionComputedMetadata"
import { useMemo } from "react"
import { useSignalValue } from "reactjrx"
import { searchListActionsToolbarSignal } from "./list/states"
import { useCollections } from "../collections/useCollections"

export const REGEXP_SPECIAL_CHAR = /[!#$%^&*)(+=.<>{}[\]:;'"|~`_-]/g

export const useCollectionsForSearch = (search: string) => {
  const { notInterestedContents } = useSignalValue(
    searchListActionsToolbarSignal,
  )
  const { data } = useCollections({
    isNotInterested: notInterestedContents,
  })

  const filteredList = useMemo(() => {
    const searchRegex = new RegExp(
      search.replace(REGEXP_SPECIAL_CHAR, `\\$&`),
      "i",
    )

    return data
      ?.map((item) => ({
        item,
        title: getCollectionComputedMetadata(item).title ?? "",
      }))
      .filter(({ title }) => {
        const indexOfFirstMatch = title?.search(searchRegex) || 0
        return indexOfFirstMatch >= 0
      })
      .sort((a, b) => sortByTitleComparator(a.title || "", b.title || ""))
      .map(({ item }) => item._id)
  }, [data, search])

  return { data: filteredList }
}
