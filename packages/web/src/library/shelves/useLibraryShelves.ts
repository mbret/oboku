import { useCollections } from "../../collections/useCollections"
import { useMemo } from "react"
import { libraryStateSignal } from "../states"
import { useSignalValue } from "reactjrx"
import { collectionsListSignal } from "./state"
import { useCollection } from "../../collections/useCollection"
import { COLLECTION_EMPTY_ID } from "../../constants.shared"

export const useLibraryShelves = () => {
  const { showNotInterestedCollections } = useSignalValue(
    libraryStateSignal,
    ({ showNotInterestedCollections }) => ({ showNotInterestedCollections })
  )
  const collectionReadingState = useSignalValue(
    collectionsListSignal,
    (state) => state.readingState
  )
  const { data: collections } = useCollections({
    isNotInterested: showNotInterestedCollections ? "with" : "none",
    readingState: collectionReadingState
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
