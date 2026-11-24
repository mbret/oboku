import { useBooks } from "../books/states"
import { selectStoredBookIds, useStoredDownloads } from "./useStoredDownloads"

export const useDownloadedBooks = () => {
  const { data: storedBookIds } = useStoredDownloads(selectStoredBookIds)
  const { data: books } = useBooks()
  const storedBookIdSet = new Set(storedBookIds)

  return books?.filter(function isStored(book) {
    return storedBookIdSet.has(book._id)
  })
}
