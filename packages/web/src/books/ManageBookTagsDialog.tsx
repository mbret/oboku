import { useCallback } from "react"
import { FC } from "react"
import { atom, useRecoilCallback, useRecoilState, useRecoilValue } from "recoil"
import { useTagIds, useTagsByIds } from "../tags/helpers"
import { TagsSelectionDialog } from "../tags/TagsSelectionDialog"
import { useAddTagToBook, useRemoveTagFromBook } from "./helpers"
import { bookState } from "./states"

const openManageBookTagsDialogState = atom<string | undefined>({
  key: "openManageBookTagsDialogState",
  default: undefined
})

export const useManageBookTagsDialog = () => {
  const openManageBookTagsDialog = useRecoilCallback(
    ({ set }) =>
      (bookId: string) => {
        set(openManageBookTagsDialogState, bookId)
      },
    []
  )

  const closeManageBookTagsDialog = useRecoilCallback(({ set }) => () => {
    set(openManageBookTagsDialogState, undefined)
  })

  return { openManageBookTagsDialog, closeManageBookTagsDialog }
}

export const ManageBookTagsDialog: FC<{}> = () => {
  const [bookId, setOpenManageBookTagsDialogState] = useRecoilState(
    openManageBookTagsDialogState
  )
  const open = !!bookId
  const { data: tags = [] } = useTagIds()
  const book = useRecoilValue(
    bookState({ bookId: bookId || "-1", tags: useTagsByIds().data })
  )
  const { mutate: addTagToBook } = useAddTagToBook()
  const { mutate: removeFromBook } = useRemoveTagFromBook()
  const bookTags = book?.tags

  const onClose = useCallback(() => {
    setOpenManageBookTagsDialogState(undefined)
  }, [setOpenManageBookTagsDialogState])

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
