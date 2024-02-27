import { useCollectionsWithPrivacy } from "../../collections/states"
import { useBooks } from "../../books/states"
import { useMemo } from "react"
import { libraryStateSignal } from "../states"
import { useSignalValue } from "reactjrx"
import { collectionsListSignal } from "./state"
import { ReadingStateState } from "@oboku/shared"

export const useLibraryCollections = () => {
  const { showNotInterestedCollections } = useSignalValue(
    libraryStateSignal,
    ({ showNotInterestedCollections }) => ({ showNotInterestedCollections })
  )
  const collectionReadingState = useSignalValue(
    collectionsListSignal,
    (state) => state.readingState
  )
  const { data: visibleCollections } = useCollectionsWithPrivacy()
  const { data: books } = useBooks()

  const collectionIds = useMemo(
    () =>
      visibleCollections
        ?.filter((collection) => {
          const booksFromCollection =
            books?.filter((book) => collection.books.includes(book._id)) ?? []

          const onlyWantOngoingAndIsFinished =
            collectionReadingState === "ongoing" &&
            booksFromCollection.length > 0 &&
            booksFromCollection.every(
              (book) =>
                book.readingStateCurrentState === ReadingStateState.Finished
            )

          const onlyWantFinishedAndHasSomeNonFinished =
            collectionReadingState === "finished" &&
            (booksFromCollection.some(
              (book) =>
                book.readingStateCurrentState !== ReadingStateState.Finished
            ) ||
              booksFromCollection.length === 0)

          if (
            onlyWantFinishedAndHasSomeNonFinished ||
            onlyWantOngoingAndIsFinished
          ) {
            return false
          }

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
    [
      visibleCollections,
      books,
      showNotInterestedCollections,
      collectionReadingState
    ]
  )

  return { data: collectionIds }
}
