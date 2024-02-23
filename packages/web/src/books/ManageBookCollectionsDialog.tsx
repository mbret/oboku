import { FC, useCallback } from "react"
import { useCollectionIdsState } from "../collections/states"
import { useAddCollectionToBook, useRemoveCollectionFromBook } from "./helpers"
import { useBookState } from "./states"
import { CollectionsSelectionDialog } from "../collections/CollectionsSelectionDialog"
import { libraryStateSignal } from "../library/states"
import { useLocalSettings } from "../settings/states"
import { useProtectedTagIds, useTagsByIds } from "../tags/helpers"
import { SIGNAL_RESET, signal, useSignalValue } from "reactjrx"

const openManageBookCollectionsDialogStateSignal = signal<string | undefined>({
  key: "openManageBookCollectionsDialogState",
  default: undefined
})

export const useManageBookCollectionsDialog = () => {
  const openManageBookCollectionsDialog = useCallback(
    (bookId: string) =>
      openManageBookCollectionsDialogStateSignal.setValue(bookId),
    []
  )

  const closeManageBookCollectionsDialog = useCallback(
    () => openManageBookCollectionsDialogStateSignal.setValue(SIGNAL_RESET),
    []
  )

  return { openManageBookCollectionsDialog, closeManageBookCollectionsDialog }
}

export const ManageBookCollectionsDialog: FC<{}> = () => {
  const id = useSignalValue(openManageBookCollectionsDialogStateSignal)
  const libraryState = useSignalValue(libraryStateSignal)
  const open = !!id
  const collections = useCollectionIdsState({
    libraryState,
    localSettingsState: useLocalSettings(),
    protectedTagIds: useProtectedTagIds().data
  })

  const book = useBookState({ bookId: id, tags: useTagsByIds().data })
  const { mutate: addToBook } = useAddCollectionToBook()
  const { mutate: removeFromBook } = useRemoveCollectionFromBook()
  const bookCollection = book?.collections

  const isSelected = (id: string) =>
    !!bookCollection?.find((item) => item === id)

  const onClose = useCallback(
    () => openManageBookCollectionsDialogStateSignal.setValue(undefined),
    []
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
