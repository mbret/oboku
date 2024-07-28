import { useMemo } from "react"
import { useSignalValue } from "reactjrx"
import { useBooks } from "../books/states"
import { booksDownloadStateSignal, DownloadState } from "./states"

export const useDownloadedBooks = () => {
  const downloadState = useSignalValue(booksDownloadStateSignal)
  const { data: books } = useBooks()

  return useMemo(
    () =>
      books?.filter(
        (book) =>
          downloadState[book._id]?.downloadState === DownloadState.Downloaded
      ),
    [downloadState, books]
  )
}
