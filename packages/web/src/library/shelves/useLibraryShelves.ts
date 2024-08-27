import { useCollections } from "../../collections/useCollections"
import { useMemo } from "react"
import { libraryStateSignal } from "../books/states"
import { useSignalValue } from "reactjrx"
import { libraryShelvesSettingsSignal } from "./state"
import { useCollection } from "../../collections/useCollection"
import { COLLECTION_EMPTY_ID } from "../../constants.shared"

export const useLibraryShelves = () => {
  const { readingState, showNotInterestedCollections } = useSignalValue(
    libraryShelvesSettingsSignal,
    ({ readingState, showNotInterestedCollections }) => ({
      readingState,
      showNotInterestedCollections
    })
  )
  const { data: collections } = useCollections({
    isNotInterested: showNotInterestedCollections ? "with" : "none",
    readingState
  })
  const { data: emptyCollection } = useCollection({
    id: COLLECTION_EMPTY_ID,
    isNotInterested: showNotInterestedCollections ? "with" : "none"
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
