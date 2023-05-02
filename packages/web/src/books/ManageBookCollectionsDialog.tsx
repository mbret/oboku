import { FC, useCallback } from "react"
import { useRecoilValue } from "recoil"
import { collectionIdsState } from "../collections/states"
import { useAddCollectionToBook, useRemoveCollectionFromBook } from "./helpers"
import { bookState } from "./states"
import { CollectionsSelectionDialog } from "../collections/CollectionsSelectionDialog"
import { useLibraryState } from "../library/states"
import { useLocalSettingsState } from "../settings/states"
import { useProtectedTagIds, useTagsByIds } from "../tags/helpers"
import { SIGNAL_RESET, signal, useSignal } from "reactjrx"

const [, , , , , openManageBookCollectionsDialogState] = signal<
  string | undefined
>({
  key: "openManageBookCollectionsDialogState",
  default: undefined
})

export const useManageBookCollectionsDialog = () => {
  const openManageBookCollectionsDialog = useCallback(
    (bookId: string) => openManageBookCollectionsDialogState.setState(bookId),
    []
  )

  const closeManageBookCollectionsDialog = useCallback(
    () => openManageBookCollectionsDialogState.setState(SIGNAL_RESET),
    []
  )

  return { openManageBookCollectionsDialog, closeManageBookCollectionsDialog }
}

export const ManageBookCollectionsDialog: FC<{}> = () => {
  const [id, setOpenManageBookCollectionsDialog] = useSignal(
    openManageBookCollectionsDialogState
  )
  const open = !!id
  const collections = useRecoilValue(
    collectionIdsState({
      libraryState: useLibraryState(),
      localSettingsState: useLocalSettingsState(),
      protectedTagIds: useProtectedTagIds().data
    })
  )
  const book = useRecoilValue(
    bookState({ bookId: id || "-1", tags: useTagsByIds().data })
  )
  const { mutate: addToBook } = useAddCollectionToBook()
  const { mutate: removeFromBook } = useRemoveCollectionFromBook()
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
