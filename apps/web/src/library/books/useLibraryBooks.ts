import { isShallowEqual } from "@oboku/shared"
import { useMemo, useRef } from "react"
import { sortBooksBy } from "../../books/helpers"
import { useBooks } from "../../books/states"
import {
  type BooksDownloadState,
  DownloadState,
  booksDownloadStateSignal,
} from "../../download/states"
import { useSignalValue } from "reactjrx"
import { libraryStateSignal } from "./states"

const selectDownloadedBookIds = (bookDownloadState: BooksDownloadState) =>
  Object.keys(bookDownloadState).filter(
    (bookId) =>
      bookDownloadState[bookId]?.downloadState === DownloadState.Downloaded,
  )

export const useLibraryBooks = () => {
  const results = useRef<string[]>([])
  const library = useSignalValue(libraryStateSignal)
  const { data: unsortedBooks } = useBooks()
  const downloadedBookIds = useSignalValue(
    booksDownloadStateSignal,
    selectDownloadedBookIds,
    isShallowEqual,
  )
  const {
    downloadState,
    isNotInterested,
    readingStates,
    sorting,
    tags: filteredTags,
  } = library
  const downloadedBookIdsFilter =
    downloadState === DownloadState.Downloaded ? downloadedBookIds : undefined

  const bookIds = useMemo(
    function computeVisibleBookIds() {
      const downloadedBookIdSet =
        downloadedBookIdsFilter && new Set(downloadedBookIdsFilter)

      const filteredBooks = (unsortedBooks ?? []).filter(
        function matchesLibraryFilters(book) {
          if (downloadedBookIdSet && !downloadedBookIdSet.has(book._id)) {
            return false
          }

          if (
            filteredTags?.length &&
            !book?.tags?.some((tagId) => filteredTags.includes(tagId))
          ) {
            return false
          }

          if (
            readingStates.length &&
            !readingStates.includes(book.readingStateCurrentState)
          ) {
            return false
          }

          if (isNotInterested !== "only" && book.isNotInterested) return false

          if (isNotInterested === "only" && !book.isNotInterested) return false

          return true
        },
      )

      return sortBooksBy(filteredBooks, sorting).map((book) => book._id)
    },
    [
      downloadedBookIdsFilter,
      filteredTags,
      isNotInterested,
      readingStates,
      sorting,
      unsortedBooks,
    ],
  )

  if (bookIds.length !== results.current.length) {
    results.current = bookIds
  } else {
    for (let i = 0; i < bookIds.length; i++) {
      if (bookIds[i] !== results.current[i]) {
        results.current = bookIds
        break
      }
    }
  }

  return results.current
}
