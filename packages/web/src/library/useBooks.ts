import { useRef } from "react"
import { useRecoilValue } from "recoil"
import { useBooksSortedBy } from "../books/helpers"
import { booksAsArrayState } from "../books/states"
import { DownloadState } from "../download/states"
import { libraryState } from "./states"

export const useBooks = () => {
  const results = useRef<string[]>([])
  const library = useRecoilValue(libraryState)
  const filteredTags = library.tags
  const unsortedBooks = useRecoilValue(booksAsArrayState)

  const filteredBooks = unsortedBooks.filter((book) => {
    if (
      library.downloadState === DownloadState.Downloaded &&
      book.downloadState.downloadState !== DownloadState.Downloaded
    ) {
      return false
    }

    if (
      filteredTags.length > 0 &&
      !book?.tags?.some((b) => filteredTags.includes(b))
    ) {
      return false
    }

    if (
      library.readingStates.length > 0 &&
      !library.readingStates.includes(book.readingStateCurrentState)
    ) {
      return false
    }

    if (library.isNotInterested === "hide" && book.isNotInterested) return false
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
