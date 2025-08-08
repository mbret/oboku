import {
  type CollectionDocType,
  difference,
  ReadingStateState,
} from "@oboku/shared"
import { useLocalSettings } from "../settings/states"
import { useQuery$, useSignalValue } from "reactjrx"
import { latestDatabase$ } from "../rxdb/RxDbProvider"
import { combineLatest, map, switchMap } from "rxjs"
import type { MangoQuery } from "rxdb"
import type { DeepReadonlyArray } from "rxdb/dist/types/types"
import { libraryStateSignal } from "../library/books/states"
import { intersection } from "@oboku/shared"
import { observeBooks } from "../books/dbHelpers"

type CollectionReadingState = "ongoing" | "finished" | "unread" | undefined

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
  readingState?: CollectionReadingState | "any"
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
        switchMap((db) => {
          const protectedBooks$ = observeBooks({
            db,
            protected: "only",
          })

          const visibleBooks$ = observeBooks({
            db,
            protected: includeProtected ? "with" : "none",
          })

          /**
           * @important
           *
           * We need to get all the books since we use them
           * to check whether it's safe or not later
           */
          return combineLatest([protectedBooks$, visibleBooks$]).pipe(
            switchMap(([protectedBooks, visibleBooks]) => {
              const protectedBookIds = protectedBooks.map(({ _id }) => _id)
              const notInterestedBookIds = visibleBooks
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
                     * Filter out collections containing protected books
                     */
                    .filter((collection) => {
                      if (
                        includeProtected ||
                        collection.books.length === 0 ||
                        showCollectionWithProtectedContent ===
                          "hasNormalContent"
                      )
                        return true

                      const hasProtectedBook =
                        intersection(collection.books, protectedBookIds)
                          .length > 0

                      if (hasProtectedBook) return false

                      return true
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
                      const booksFromCollection = visibleBooks.filter((book) =>
                        collection.books.includes(book._id),
                      )

                      const collectionReadingState =
                        booksFromCollection.reduce<
                          CollectionReadingState | undefined
                        >((acc, book) => {
                          const bookState = book.readingStateCurrentState

                          if (acc === "ongoing") return "ongoing"
                          if (bookState === ReadingStateState.Reading)
                            return "ongoing"
                          if (bookState === ReadingStateState.Finished) {
                            return acc === "unread" ? "ongoing" : "finished"
                          }
                          if (bookState === ReadingStateState.NotStarted) {
                            // If previous state was finished, now it's ongoing (mixed states)
                            return acc === "finished" ? "ongoing" : "unread"
                          }

                          return acc
                        }, undefined) ?? "unread"

                      if (
                        (readingState === "ongoing" &&
                          collectionReadingState !== "ongoing") ||
                        (readingState === "finished" &&
                          collectionReadingState !== "finished") ||
                        (readingState === "unread" &&
                          collectionReadingState !== "unread")
                      ) {
                        return false
                      }

                      return true
                    })
                    .map((item) => item?.toJSON() as CollectionDocType),
                ),
              )
            }),
          )
        }),
      )
    },
    ...options,
  })
}
