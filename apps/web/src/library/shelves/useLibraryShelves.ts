import { useCollections } from "../../collections/useCollections"
import { useMemo } from "react"
import { useSignalValue } from "reactjrx"
import { libraryShelvesFiltersSignal } from "./filters/states"
import { useCollection } from "../../collections/useCollection"
import { useConfig } from "../../config/useConfig"

export const useLibraryShelves = () => {
  const { data: config } = useConfig()
  const { readingState, showNotInterestedCollections } = useSignalValue(
    libraryShelvesFiltersSignal,
  )

  const { data: collections } = useCollections({
    isNotInterested: showNotInterestedCollections ? "with" : "none",
    readingState,
  })
  const { data: emptyCollection } = useCollection({
    id: config?.COLLECTION_EMPTY_ID,
    isNotInterested: showNotInterestedCollections ? "with" : "none",
  })

  const collectionIds = useMemo(() => {
    const collectionsWithEmpty =
      emptyCollection && emptyCollection.books.length > 0
        ? [emptyCollection, ...(collections ?? [])]
        : collections

    return collectionsWithEmpty?.map((collection) => collection._id)
  }, [collections, emptyCollection])

  return { data: collectionIds }
}
