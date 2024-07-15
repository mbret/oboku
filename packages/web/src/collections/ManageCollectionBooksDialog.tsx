import { FC } from "react"
import {
  useRemoveCollectionFromBook,
  useAddCollectionToBook
} from "../books/helpers"
import { useBooksAsArrayState } from "../books/states"
import { useMemo } from "react"
import { useCallback } from "react"
import { BooksSelectionDialog } from "../books/BooksSelectionDialog"
import { booksDownloadStateSignal } from "../download/states"
import { useSignalValue } from "reactjrx"
import { useCollection } from "./useCollection"

export const ManageCollectionBooksDialog: FC<{
  onClose: () => void
  open: boolean
  collectionId: string
}> = ({ onClose, open, collectionId }) => {
  const { data: collection } = useCollection({
    id: collectionId
  })
  const { data: books } = useBooksAsArrayState({
    normalizedBookDownloadsState: useSignalValue(booksDownloadStateSignal)
  })
  const { mutate: addToBook } = useAddCollectionToBook()
  const { mutate: removeFromBook } = useRemoveCollectionFromBook()
  const collectionBooks = useMemo(
    () => collection?.books?.map((item) => item) || [],
    [collection]
  )

  const data = useMemo(
    () =>
      books.map((item) => ({
        id: item._id,
        selected: !!collectionBooks.find((id) => id === item._id)
      })),
    [books, collectionBooks]
  )

  const onItemClick = useCallback(
    ({ id: bookId, selected }: { id: string; selected: boolean }) => {
      if (selected) {
        collectionId && removeFromBook({ _id: bookId, collectionId })
      } else {
        collectionId && addToBook({ _id: bookId, collectionId })
      }
    },
    [collectionId, addToBook, removeFromBook]
  )

  return (
    <BooksSelectionDialog
      open={open}
      onClose={onClose}
      onItemClick={onItemClick}
      data={data}
    />
  )
}
