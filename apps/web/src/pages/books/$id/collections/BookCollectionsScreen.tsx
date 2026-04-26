import { memo } from "react"
import { useParams } from "react-router"
import { useMutation } from "@tanstack/react-query"
import { AddRounded } from "@mui/icons-material"
import { IconButton } from "@mui/material"
import type { CollectionDocType } from "@oboku/shared"
import type { DeepReadonlyObject } from "rxdb"
import { NotFoundPage } from "../../../../common/NotFoundPage"
import {
  useAddCollectionToBook,
  useRemoveCollectionFromBook,
} from "../../../../books/helpers"
import { useBook } from "../../../../books/states"
import { useCollections } from "../../../../collections/useCollections"
import { SelectableCollectionList } from "../../../../collections/lists/SelectableCollectionList"
import { getCollectionComputedMetadata } from "../../../../collections/getCollectionComputedMetadata"
import { openAddCollectionDialog } from "../../../../library/shelves/AddCollectionDialog"
import { EntitySelectionPage } from "../../../../common/selection"
import { notify, notifyError } from "../../../../notifications/toasts"

const getCollectionSearchableText = (
  collection: DeepReadonlyObject<CollectionDocType>,
) => getCollectionComputedMetadata(collection).title ?? ""

const EMPTY_COLLECTIONS: DeepReadonlyObject<CollectionDocType>[] = []
const listStyle = { flex: 1 }

type ScreenParams = {
  id: string
}

export const BookCollectionsScreen = memo(function BookCollectionsScreen() {
  const { id: bookId } = useParams<ScreenParams>()
  const { data: collections = EMPTY_COLLECTIONS } = useCollections()
  const { data: book } = useBook({ id: bookId })
  const { mutateAsync: addCollectionToBook } = useAddCollectionToBook()
  const { mutateAsync: removeCollectionFromBook } =
    useRemoveCollectionFromBook()

  const { mutate: save, isPending: isSaving } = useMutation({
    mutationFn: async ({
      toAdd,
      toRemove,
    }: {
      toAdd: string[]
      toRemove: string[]
    }) => {
      if (!bookId) return
      await Promise.all([
        ...toAdd.map((collectionId) =>
          addCollectionToBook({ _id: bookId, collectionId }),
        ),
        ...toRemove.map((collectionId) =>
          removeCollectionFromBook({ _id: bookId, collectionId }),
        ),
      ])
    },
    onSuccess: () => {
      notify("actionSuccess")
    },
    onError: notifyError,
  })

  if (!bookId || book === null) return <NotFoundPage />

  return (
    <EntitySelectionPage
      title="Manage collections"
      searchPlaceholder="Search collections…"
      searchAriaLabel="Search collections"
      items={collections}
      persistedIds={book?.collections}
      entityKey={bookId}
      getSearchableText={getCollectionSearchableText}
      isSaving={isSaving}
      onSave={save}
      toolbarActions={
        <IconButton
          onClick={openAddCollectionDialog}
          color="primary"
          disabled={isSaving}
          aria-label="Create a new collection"
        >
          <AddRounded />
        </IconButton>
      }
      renderList={({ filteredIds, selectedItems, toggleSelection }) => (
        <SelectableCollectionList
          style={listStyle}
          data={filteredIds}
          selected={selectedItems}
          onItemClick={({
            id: collectionId,
          }: {
            id: string
            selected: boolean
          }) => {
            toggleSelection(collectionId)
          }}
        />
      )}
    />
  )
})
