import { useCallback, useMemo } from "react"
import { useCollections } from "../collections/useCollections"
import { useAddCollectionToBook, useRemoveCollectionFromBook } from "./helpers"
import { useBook } from "./states"
import { CollectionsSelectionDialog } from "../collections/CollectionsSelectionDialog"
import { SIGNAL_RESET, signal, useSignalValue } from "reactjrx"

const openManageBookCollectionsDialogStateSignal = signal<string | undefined>({
  key: "openManageBookCollectionsDialogState",
})

export const useManageBookCollectionsDialog = () => {
  const openManageBookCollectionsDialog = useCallback(
    (bookId: string) =>
      openManageBookCollectionsDialogStateSignal.setValue(bookId),
    [],
  )

  const closeManageBookCollectionsDialog = useCallback(
    () => openManageBookCollectionsDialogStateSignal.setValue(SIGNAL_RESET),
    [],
  )

  return { openManageBookCollectionsDialog, closeManageBookCollectionsDialog }
}

export const ManageBookCollectionsDialog = () => {
  const id = useSignalValue(openManageBookCollectionsDialogStateSignal)
  const open = !!id
  const { data: collections = [] } = useCollections({
    enabled: open,
  })
  const collectionIds = useMemo(
    () => collections.map(({ _id }) => _id),
    [collections],
  )
  const { data: book } = useBook({ id })
  const { mutate: addToBook } = useAddCollectionToBook()
  const { mutate: removeFromBook } = useRemoveCollectionFromBook()
  const bookCollection = book?.collections

  const isSelected = (id: string) =>
    !!bookCollection?.find((item) => item === id)

  const onClose = useCallback(
    () => openManageBookCollectionsDialogStateSignal.setValue(undefined),
    [],
  )

  const onItemClick = useCallback(
    ({ id: collectionId, selected }: { id: string; selected: boolean }) => {
      if (selected) {
        id && removeFromBook({ _id: id, collectionId })
      } else {
        id && addToBook({ _id: id, collectionId })
      }
    },
    [removeFromBook, addToBook, id],
  )

  return (
    <CollectionsSelectionDialog
      title="Manage collections"
      open={open}
      onClose={onClose}
      data={collectionIds}
      selected={isSelected}
      onItemClick={onItemClick}
    />
  )
}
