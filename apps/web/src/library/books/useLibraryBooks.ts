import { useRef } from "react"
import { useBooksSortedBy } from "../../books/helpers"
import { useBooks } from "../../books/states"
import { DownloadState, useBooksDownloadState } from "../../download/states"
import { useSignalValue } from "reactjrx"
import { libraryStateSignal } from "./states"

export const useLibraryBooks = () => {
  const results = useRef<string[]>([])
  const library = useSignalValue(libraryStateSignal)
  const filteredTags = library.tags
  const { data: unsortedBooks } = useBooks()
  const booksDownloadState = useBooksDownloadState(unsortedBooks)

  const filteredBooks = unsortedBooks?.filter((book) => {
    if (
      library.downloadState === DownloadState.Downloaded &&
      booksDownloadState[book._id]?.downloadState !== DownloadState.Downloaded
    ) {
      return false
    }

    if (
      !!filteredTags?.length &&
      !book?.tags?.some((b) => filteredTags.includes(b))
    ) {
      return false
    }

    if (
      !!library.readingStates.length &&
      !library.readingStates.includes(book.readingStateCurrentState)
    ) {
      return false
    }

    if (library.isNotInterested !== "only" && book.isNotInterested) return false

    if (library.isNotInterested === "only" && !book.isNotInterested)
      return false

    return true
  })

  const sortedList = useBooksSortedBy(filteredBooks, library.sorting)
  const bookIds = sortedList.map((item) => item._id)

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
