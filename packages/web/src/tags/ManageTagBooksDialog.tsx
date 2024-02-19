import { FC, useMemo } from "react"
import { useRemoveTagFromBook, useAddTagToBook } from "../books/helpers"
import { useBooksAsArrayState } from "../books/states"
import { useCallback } from "react"
import { BooksSelectionDialog } from "../books/BooksSelectionDialog"
import { useProtectedTagIds, useTag } from "./helpers"
import { normalizedBookDownloadsStateSignal } from "../download/states"
import { signal, useSignalValue } from "reactjrx"
import { libraryStateSignal } from "../library/states"

export const isManageTagBooksDialogOpenedWithState = signal<string | undefined>(
  {
    key: "isManageTagBooksDialogOpenedWith",
    default: undefined
  }
)

export const ManageTagBooksDialog: FC<{}> = () => {
  const isManageTagBooksDialogOpenedWith = useSignalValue(
    isManageTagBooksDialogOpenedWithState
  )
  const { data: tag } = useTag(isManageTagBooksDialogOpenedWith || "-1")
  const libraryState = useSignalValue(libraryStateSignal)
  const normalizedBookDownloadsState = useSignalValue(
    normalizedBookDownloadsStateSignal
  )

  const { data: books } = useBooksAsArrayState({
    libraryState,
    normalizedBookDownloadsState,
    protectedTagIds: useProtectedTagIds().data
  })
  const { mutate: addTagToBook } = useAddTagToBook()
  const { mutate: removeFromBook } = useRemoveTagFromBook()
  const tagBooks = useMemo(() => tag?.books?.map((item) => item) || [], [tag])
  const tagId = isManageTagBooksDialogOpenedWith

  const onClose = () => {
    isManageTagBooksDialogOpenedWithState.setValue(undefined)
  }

  const data = useMemo(
    () =>
      books.map((item) => ({
        id: item._id,
        selected: !!tagBooks.find((id) => id === item._id)
      })),
    [books, tagBooks]
  )

  const onItemClick = useCallback(
    ({ id: bookId, selected }: { id: string; selected: boolean }) => {
      if (selected) {
        tagId && removeFromBook({ _id: bookId, tagId })
      } else {
        tagId && addTagToBook({ _id: bookId, tagId })
      }
    },
    [removeFromBook, addTagToBook, tagId]
  )

  return (
    <BooksSelectionDialog
      open={!!tagId}
      onClose={onClose}
      data={data}
      onItemClick={onItemClick}
    />
  )
}
