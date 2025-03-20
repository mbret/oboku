import { memo, useMemo } from "react"
import { useRemoveTagFromBook, useAddTagToBook } from "../books/helpers"
import { useBooks } from "../books/states"
import { useCallback } from "react"
import { BooksSelectionDialog } from "../books/BooksSelectionDialog"
import { useTag } from "./helpers"
import { signal, useSignalValue } from "reactjrx"

export const isManageTagBooksDialogOpenedWithState = signal<string | undefined>(
  {
    key: "isManageTagBooksDialogOpenedWith",
    default: undefined,
  },
)

export const ManageTagBooksDialog = memo(() => {
  const isManageTagBooksDialogOpenedWith = useSignalValue(
    isManageTagBooksDialogOpenedWithState,
  )
  const isOpen = !!isManageTagBooksDialogOpenedWith
  const { data: tag } = useTag(isManageTagBooksDialogOpenedWith)
  const { data: books } = useBooks({
    subscribed: isOpen,
  })
  const { mutate: addTagToBook } = useAddTagToBook()
  const { mutate: removeFromBook } = useRemoveTagFromBook()
  const tagId = isManageTagBooksDialogOpenedWith

  const onClose = () => {
    isManageTagBooksDialogOpenedWithState.setValue(undefined)
  }

  const data = useMemo(() => books?.map((item) => item._id), [books])

  const selected = useMemo(
    () =>
      books?.reduce(
        (acc, item) => ({
          ...acc,
          [item._id]: !!tag?.books.find((id) => id === item._id),
        }),
        {},
      ) || {},
    [books, tag],
  )

  const onItemClick = useCallback(
    ({ id: bookId, selected }: { id: string; selected: boolean }) => {
      if (selected) {
        tagId && removeFromBook({ _id: bookId, tagId })
      } else {
        tagId && addTagToBook({ _id: bookId, tagId })
      }
    },
    [removeFromBook, addTagToBook, tagId],
  )

  return (
    <BooksSelectionDialog
      open={!!tagId}
      onClose={onClose}
      data={data}
      onItemClick={onItemClick}
      selected={selected}
    />
  )
})
