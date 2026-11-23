import { isShallowEqual } from "@oboku/shared"
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

/**
 * The ids of the books the library shows, filtered and sorted by the library
 * state. The array keeps its reference while the ids stay the same, through
 * react-query's structural sharing of the `select` result.
 */
export const useLibraryBooks = () => {
  const library = useSignalValue(libraryStateSignal)
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

  const { data: bookIds } = useBooks({
    select: function selectVisibleBookIds(books) {
      const downloadedBookIdSet =
        downloadedBookIdsFilter && new Set(downloadedBookIdsFilter)

      const filteredBooks = books.filter(function matchesLibraryFilters(book) {
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
      })

      return sortBooksBy(filteredBooks, sorting).map((book) => book._id)
    },
  })

  return bookIds ?? []
}
