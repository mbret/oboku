import {
  type CollectionDocType,
  difference,
  ReadingStateState,
} from "@oboku/shared"
import { useLocalSettings } from "../settings/states"
import { useQuery$, useSignalValue } from "reactjrx"
import { latestDatabase$ } from "../rxdb/RxDbProvider"
import { map, switchMap } from "rxjs"
import type { MangoQuery } from "rxdb"
import type { DeepReadonlyArray } from "rxdb/dist/types/types"
import { libraryStateSignal } from "../library/books/states"
import { intersection } from "@oboku/shared"
import { observeBooks } from "../books/dbHelpers"

export const useCollections = ({
  queryObj,
  bookIds,
  ids,
  isNotInterested,
  readingState = "any",
  includeProtected: _includeProtected,
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
  includeProtected?: boolean
} = {}) => {
  const serializedBookIds = JSON.stringify(bookIds)
  const serializedIds = JSON.stringify(ids)
  const { isLibraryUnlocked } = useSignalValue(libraryStateSignal)
  const { showCollectionWithProtectedContent } = useLocalSettings()
  const includeProtected = _includeProtected || isLibraryUnlocked

  return useQuery$({
    queryKey: [
      "rxdb",
      "get",
      "collections",
      {
        serializedBookIds,
        serializedIds,
        showCollectionWithProtectedContent,
        includeProtected,
        isNotInterested,
        readingState,
      },
      queryObj,
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
            includeProtected,
          }).pipe(
            switchMap((books) => {
              const visibleBooks = books.map(({ _id }) => _id)
              const notInterestedBookIds = books
                .filter(({ isNotInterested }) => !!isNotInterested)
                .map(({ _id }) => _id)

              const finalQueryObj: MangoQuery<CollectionDocType> = {
                ...queryObj,
                selector: {
                  ...queryObj?.selector,
                  ...(ids && {
                    _id: {
                      $in: Array.from(ids),
                    },
                  }),
                  ...(bookIds && {
                    books: {
                      $in: Array.from(bookIds),
                    },
                  }),
                },
              }

              const collections$ =
                db.collections.obokucollection.find(finalQueryObj).$

              return collections$.pipe(
                map((collections) =>
                  collections
                    /**
                     * @important
                     *
                     * Fitler out collections containing protected books
                     */
                    .filter((collection) => {
                      if (
                        includeProtected ||
                        collection.books.length === 0 ||
                        showCollectionWithProtectedContent ===
                          "hasNormalContent"
                      )
                        return true

                      /**
                       * If we have a book that is not in the list of protected books
                       * we can assume it's unsafe
                       */
                      const extraBooksFromCollection = difference(
                        collection.books,
                        visibleBooks,
                      )

                      const hasSuspiciousExtraBook =
                        extraBooksFromCollection.length > 0

                      return !hasSuspiciousExtraBook
                    })
                    /**
                     * @important
                     *
                     * Filter out collections based on interest content.
                     * The only case is if we only want not interested, in
                     * this case we want collections that contains at least
                     * one of the not interested book.
                     */
                    .filter((collection) => {
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
                          notInterestedBookIds,
                        )

                        return booksNotProtected.length > 0
                      }

                      return true
                    })
                    /**
                     * Filter collection by reading state
                     */
                    .filter((collection) => {
                      const booksFromCollection = books.filter((book) =>
                        collection.books.includes(book._id),
                      )

                      if (
                        readingState === "finished" &&
                        (booksFromCollection.some(
                          (book) =>
                            book.readingStateCurrentState !==
                            ReadingStateState.Finished,
                        ) ||
                          booksFromCollection.length === 0)
                      ) {
                        return false
                      }

                      if (
                        readingState === "ongoing" &&
                        booksFromCollection.length > 0 &&
                        booksFromCollection.every(
                          (book) =>
                            book.readingStateCurrentState ===
                            ReadingStateState.Finished,
                        )
                      ) {
                        return false
                      }

                      return true
                    })
                    .map((item) => item?.toJSON() as CollectionDocType),
                ),
              )
            }),
          ),
        ),
      )
    },
    ...options,
  })
}
