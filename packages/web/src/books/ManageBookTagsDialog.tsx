import { useCallback } from "react"
import { FC } from "react"
import { useTagIds, useTagsByIds } from "../tags/helpers"
import { TagsSelectionDialog } from "../tags/TagsSelectionDialog"
import { useAddTagToBook, useRemoveTagFromBook } from "./helpers"
import { useBookState } from "./states"
import { SIGNAL_RESET, signal, useSignalValue } from "reactjrx"

const openManageBookTagsDialogStateSignal = signal<string | undefined>({
  key: "openManageBookTagsDialogState",
  default: undefined
})

export const useManageBookTagsDialog = () => {
  const openManageBookTagsDialog = useCallback((bookId: string) => {
    openManageBookTagsDialogStateSignal.setValue(bookId)
  }, [])

  const closeManageBookTagsDialog = useCallback(() => {
    openManageBookTagsDialogStateSignal.setValue(SIGNAL_RESET)
  }, [])

  return { openManageBookTagsDialog, closeManageBookTagsDialog }
}

export const ManageBookTagsDialog: FC<{}> = () => {
  const bookId = useSignalValue(openManageBookTagsDialogStateSignal)
  const open = !!bookId
  const { data: tags = [] } = useTagIds()
  const book = useBookState({
    bookId: bookId || "-1",
    tags: useTagsByIds().data
  })
  const { mutate: addTagToBook } = useAddTagToBook()
  const { mutate: removeFromBook } = useRemoveTagFromBook()
  const bookTags = book?.tags

  const onClose = useCallback(() => {
    openManageBookTagsDialogStateSignal.setValue(undefined)
  }, [])

  const selected = useCallback(
    (item: string) => !!bookTags?.find((id) => id === item),
    [bookTags]
  )

  const onItemClick = useCallback(
    ({ id: tagId, selected }: { id: string; selected: boolean }) => {
      if (selected) {
        bookId && removeFromBook({ _id: bookId, tagId })
      } else {
        bookId && addTagToBook({ _id: bookId, tagId })
      }
    },
    [removeFromBook, addTagToBook, bookId]
  )

  return (
    <TagsSelectionDialog
      title="Manage tags"
      open={open}
      onClose={onClose}
      data={tags}
      selected={selected}
      onItemClick={onItemClick}
    />
  )
}
