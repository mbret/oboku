import { useState, useMemo, useCallback, ComponentProps } from "react"
import { Button, Stack, Toolbar } from "@mui/material"
import { ROUTES } from "../../constants"
import { useNavigate } from "react-router-dom"
import { CollectionList } from "../../collections/list/CollectionList"
import { signal, useSignalValue } from "reactjrx"
import { useLibraryShelves } from "./useLibraryShelves"
import { FilterBar } from "./FilterBar"
import { collectionsListSignal } from "./state"
import { CollectionDocType } from "@oboku/shared"
import { DeepReadonlyObject } from "rxdb"
import { AddCollectionDialog } from "./AddCollectionDialog"

type RestoreStateFromState = ComponentProps<
  typeof CollectionList
>["restoreStateFrom"]

const libraryCollectionScreenPreviousScrollState =
  signal<RestoreStateFromState>({
    key: `libraryCollectionScreenPreviousScrollState`,
    default: undefined
  })

export const LibraryCollectionScreen = () => {
  const navigate = useNavigate()
  const [isAddCollectionDialogOpened, setIsAddCollectionDialogOpened] =
    useState(false)
  const libraryCollectionScreenPreviousScroll = useSignalValue(
    libraryCollectionScreenPreviousScrollState
  )
  const { viewMode } = useSignalValue(
    collectionsListSignal,
    ({ viewMode }) => ({ viewMode })
  )
  const { data: collections } = useLibraryShelves()

  const listHeader = useMemo(
    () => (
      <Toolbar>
        <Button
          style={{
            width: "100%"
          }}
          variant="outlined"
          color="primary"
          onClick={() => setIsAddCollectionDialogOpened(true)}
        >
          Create a new collection
        </Button>
      </Toolbar>
    ),
    [setIsAddCollectionDialogOpened]
  )

  const listRenderHeader = useCallback(() => listHeader, [listHeader])

  const onItemClick = useCallback(
    (item: DeepReadonlyObject<CollectionDocType>) => {
      navigate(ROUTES.COLLECTION_DETAILS.replace(":id", item._id))
    },
    [navigate]
  )

  return (
    <Stack flex={1} overflow="hidden">
      <FilterBar />
      {!!collections && (
        <CollectionList
          style={{
            flex: 1
          }}
          data={collections}
          renderHeader={listRenderHeader}
          onItemClick={onItemClick}
          viewMode={viewMode}
          onStateChange={libraryCollectionScreenPreviousScrollState.setValue}
          restoreStateFrom={libraryCollectionScreenPreviousScroll}
        />
      )}
      <AddCollectionDialog
        onClose={() => setIsAddCollectionDialogOpened(false)}
        open={isAddCollectionDialogOpened}
      />
    </Stack>
  )
}
