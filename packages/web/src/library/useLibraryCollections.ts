import { useCollectionsWithPrivacy } from "../collections/states"
import { useBooks } from "../books/states"
import { useMemo } from "react"
import { libraryStateSignal } from "./states"
import { useSignalValue } from "reactjrx"

export const useLibraryCollections = () => {
  const { showNotInterestedCollections } = useSignalValue(
    libraryStateSignal,
    ({ showNotInterestedCollections }) => ({ showNotInterestedCollections })
  )
  const { data: visibleCollections } = useCollectionsWithPrivacy()
  const { data: books } = useBooks()

  const collectionIds = useMemo(
    () =>
      visibleCollections
        ?.filter((collection) => {
          if (
            collection.books.length === 0 ||
            !books?.length ||
            showNotInterestedCollections
          )
            return true

          const hasOneInterestedBook = collection.books.some((bookId) => {
            const book = books?.find((item) => item._id === bookId)

            return !book?.isNotInterested
          })

          return hasOneInterestedBook
        })
        .map((collection) => collection._id),
    [visibleCollections, books, showNotInterestedCollections]
  )

  return { data: collectionIds }
}
