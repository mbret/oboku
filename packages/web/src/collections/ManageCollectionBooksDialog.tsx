import { FC } from "react"
import {
  useRemoveCollectionFromBook,
  useAddCollectionToBook
} from "../books/helpers"
import { useBooksAsArrayState } from "../books/states"
import { useCollectionState } from "./states"
import { useMemo } from "react"
import { useCallback } from "react"
import { BooksSelectionDialog } from "../books/BooksSelectionDialog"
import { normalizedBookDownloadsStateSignal } from "../download/states"
import { useLocalSettings } from "../settings/states"
import { useProtectedTagIds } from "../tags/helpers"
import { useSignalValue } from "reactjrx"
import { libraryStateSignal } from "../library/states"

export const ManageCollectionBooksDialog: FC<{
  onClose: () => void
  open: boolean
  collectionId: string
}> = ({ onClose, open, collectionId }) => {
  const libraryState = useSignalValue(libraryStateSignal)
  const collection = useCollectionState({
    id: collectionId || "-1",
    libraryState,
    localSettingsState: useLocalSettings(),
    protectedTagIds: useProtectedTagIds().data
  })
  const { data: books } = useBooksAsArrayState({
    libraryState,
    normalizedBookDownloadsState: useSignalValue(
      normalizedBookDownloadsStateSignal
    ),
    protectedTagIds: useProtectedTagIds().data
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
