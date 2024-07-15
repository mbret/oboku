import { CollectionDocType, directives, ReadingStateState } from "@oboku/shared"
import { useLocalSettings } from "../settings/states"
import { useForeverQuery, useSignalValue } from "reactjrx"
import { latestDatabase$ } from "../rxdb/useCreateDatabase"
import { map, switchMap } from "rxjs"
import { MangoQuery } from "rxdb"
import { getMetadataFromCollection } from "./getMetadataFromCollection"
import { DeepReadonlyArray } from "rxdb/dist/types/types"
import { libraryStateSignal } from "../library/states"
import { difference, intersection } from "lodash"
import { observeBooks } from "../books/dbHelpers"

export type Collection = CollectionDocType

export const useCollections = ({
  queryObj,
  bookIds,
  ids,
  isNotInterested,
  readingState = "any",
  ...options
}: {
  queryObj?: MangoQuery<CollectionDocType>
  enabled?: boolean
  bookIds?: DeepReadonlyArray<string>
  /**
   * `with`: will show all collections
   * `none`: will not return collections containing only not interested books
   * `only`: will return collections containing only not interested books
   */
  isNotInterested?: "with" | "none" | "only" | undefined
  readingState?: "ongoing" | "finished" | "any"
  ids?: DeepReadonlyArray<string>
} = {}) => {
  const { hideDirectivesFromCollectionName } = useLocalSettings()
  const serializedBookIds = JSON.stringify(bookIds)
  const serializedIds = JSON.stringify(ids)
  const { isLibraryUnlocked } = useSignalValue(libraryStateSignal)
  const { showCollectionWithProtectedContent } = useLocalSettings()

  return useForeverQuery({
    queryKey: [
      "rxdb",
      "get",
      "collections",
      {
        serializedBookIds,
        serializedIds,
        showCollectionWithProtectedContent,
        isLibraryUnlocked,
        hideDirectivesFromCollectionName,
        isNotInterested
      },
      queryObj
    ],
    queryFn: () => {
      return latestDatabase$.pipe(
        switchMap((db) =>
          /**
           * @important
           *
           * We need to get all the books since we use them
           * to check whether it's safe or not later
           */
          observeBooks({
            db,
            includeProtected: isLibraryUnlocked
            // isNotInterested
          }).pipe(
            switchMap((books) => {
              const protectedBookIds = books.map(({ _id }) => _id)
              const notInterestedBookIds = books
                .filter(({ isNotInterested }) => !!isNotInterested)
                .map(({ _id }) => _id)

              const finalQueryObj = {
                ...queryObj,
                selector: {
                  ...queryObj?.selector,
                  ...(ids && {
                    _id: {
                      $in: ids
                    }
                  }),
                  ...(bookIds && {
                    books: {
                      $in: bookIds
                    }
                  })
                }
              } satisfies MangoQuery<CollectionDocType>

              return db.collections.obokucollection.find(finalQueryObj).$.pipe(
                /**
                 * @important
                 *
                 * Fitler out collections containing protected books
                 */
                map((collections) =>
                  collections.filter((collection) => {
                    if (
                      isLibraryUnlocked ||
                      collection.books.length === 0 ||
                      showCollectionWithProtectedContent === "hasNormalContent"
                    )
                      return true

                    /**
                     * If we have a book that is not in the list of protected books
                     * we can assume it's unsafe
                     */
                    const extraBooksFromCollection = difference(
                      collection.books,
                      protectedBookIds
                    )

                    const hasSuspiciousExtraBook =
                      extraBooksFromCollection.length > 0

                    return !hasSuspiciousExtraBook
                  })
                ),
                /**
                 * @important
                 *
                 * Filter out collections based on interest content.
                 * The only case is if we only want not interested, in
                 * this case we want collections that contains at least
                 * one of the not interested book.
                 */
                map((collections) =>
                  collections.filter((collection) => {
                    if (isNotInterested === "only") {
                      return collection.books.length === 0
                        ? false
                        : intersection(collection.books, bookIds).length > 0
                    }

                    if (
                      isNotInterested === "none" &&
                      collection.books.length > 0
                    ) {
                      const booksNotProtected = difference(
                        collection.books,
                        notInterestedBookIds
                      )

                      return booksNotProtected.length > 0
                    }

                    return true
                  })
                ),
                /**
                 * Filter collection by reading state
                 */
                map((collections) =>
                  collections.filter((collection) => {
                    if (collection.books.length === 0) return true

                    const booksFromCollection = books.filter((book) =>
                      collection.books.includes(book._id)
                    )

                    const onlyWantOngoingAndIsFinished =
                      readingState === "ongoing" &&
                      booksFromCollection.length > 0 &&
                      booksFromCollection.every(
                        (book) =>
                          book.readingStateCurrentState ===
                          ReadingStateState.Finished
                      )

                    const onlyWantFinishedAndHasSomeNonFinished =
                      readingState === "finished" &&
                      (booksFromCollection.some(
                        (book) =>
                          book.readingStateCurrentState !==
                          ReadingStateState.Finished
                      ) ||
                        booksFromCollection.length === 0)

                    if (
                      onlyWantFinishedAndHasSomeNonFinished ||
                      onlyWantOngoingAndIsFinished
                    ) {
                      return false
                    }

                    return true
                  })
                )
              )
            })
          )
        ),
        map((items) =>
          items.map((item) => ({
            ...(item?.toJSON() as CollectionDocType),
            displayableName: hideDirectivesFromCollectionName
              ? directives.removeDirectiveFromString(
                  getMetadataFromCollection(item).title ?? ""
                )
              : getMetadataFromCollection(item).title
          }))
        )
      )
    },
    ...options
  })
}
