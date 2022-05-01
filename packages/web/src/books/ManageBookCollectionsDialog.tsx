import { FC, useCallback } from "react"
import { atom, useRecoilCallback, useRecoilState, useRecoilValue } from "recoil"
import { collectionIdsState } from "../collections/states"
import { useAddCollectionToBook, useRemoveCollectionFromBook } from "./helpers"
import { bookState } from "./states"
import { CollectionsSelectionDialog } from "../collections/CollectionsSelectionDialog"

const openManageBookCollectionsDialogState = atom<string | undefined>({
  key: "openManageBookCollectionsDialogState",
  default: undefined
})

export const useManageBookCollectionsDialog = () => {
  const openManageBookCollectionsDialog = useRecoilCallback(
    ({ set }) =>
      (bookId: string) => {
        set(openManageBookCollectionsDialogState, bookId)
      },
    []
  )

  const closeManageBookCollectionsDialog = useRecoilCallback(
    ({ set }) =>
      () => {
        set(openManageBookCollectionsDialogState, undefined)
      }
  )

  return { openManageBookCollectionsDialog, closeManageBookCollectionsDialog }
}

export const ManageBookCollectionsDialog: FC<{}> = () => {
  const [id, setOpenManageBookCollectionsDialog] = useRecoilState(
    openManageBookCollectionsDialogState
  )
  const open = !!id
  const collections = useRecoilValue(collectionIdsState)
  const book = useRecoilValue(bookState(id || "-1"))
  const [addToBook] = useAddCollectionToBook()
  const [removeFromBook] = useRemoveCollectionFromBook()
  const bookCollection = book?.collections

  const isSelected = (id: string) =>
    !!bookCollection?.find((item) => item === id)

  const onClose = useCallback(
    () => setOpenManageBookCollectionsDialog(undefined),
    [setOpenManageBookCollectionsDialog]
  )

  const onItemClick = useCallback(
    ({ id: collectionId, selected }: { id: string; selected: boolean }) => {
      if (selected) {
        id && removeFromBook({ _id: id, collectionId })
      } else {
        id && addToBook({ _id: id, collectionId })
      }
    },
    [removeFromBook, addToBook, id]
  )

  return (
    <CollectionsSelectionDialog
      title="Manage collections"
      open={open}
      onClose={onClose}
      data={collections}
      selected={isSelected}
      onItemClick={onItemClick}
    />
  )
}
