import { useState, useMemo, useCallback, memo } from "react"
import { Button, Stack, Toolbar as MuiToolbar } from "@mui/material"
import { useNavigate } from "react-router"
import { CollectionList } from "../collections/lists/CollectionList"
import { useSignalValue } from "reactjrx"
import { useLibraryShelves } from "../library/shelves/useLibraryShelves"
import { Toolbar } from "../library/shelves/Toolbar"
import { libraryShelvesFiltersSignal } from "../library/shelves/filters/states"
import type { CollectionDocType } from "@oboku/shared"
import type { DeepReadonlyObject } from "rxdb"
import { AddCollectionDialog } from "../library/shelves/AddCollectionDialog"
import { ROUTES } from "../navigation/routes"

export const LibraryCollectionScreen = memo(() => {
  const navigate = useNavigate()
  const [isAddCollectionDialogOpened, setIsAddCollectionDialogOpened] =
    useState(false)
  const { viewMode } = useSignalValue(
    libraryShelvesFiltersSignal,
    ({ viewMode }) => ({ viewMode }),
  )
  const { data: collections } = useLibraryShelves()

  const listHeader = useMemo(
    () => (
      <MuiToolbar>
        <Button
          style={{
            width: "100%",
          }}
          variant="outlined"
          color="primary"
          onClick={() => setIsAddCollectionDialogOpened(true)}
        >
          Create a new collection
        </Button>
      </MuiToolbar>
    ),
    [],
  )

  const listRenderHeader = useCallback(() => listHeader, [listHeader])

  const onItemClick = useCallback(
    (item: DeepReadonlyObject<CollectionDocType>) => {
      navigate(ROUTES.COLLECTION_DETAILS.replace(":id", item._id))
    },
    [navigate],
  )

  return (
    <Stack flex={1} overflow="hidden">
      <Toolbar
        viewMode={viewMode}
        onViewModeChange={(viewMode) => {
          libraryShelvesFiltersSignal.update((state) => ({
            ...state,
            viewMode,
          }))
        }}
      />
      {!!collections && (
        <CollectionList
          style={{
            flex: 1,
          }}
          data={collections}
          renderHeader={listRenderHeader}
          onItemClick={onItemClick}
          viewMode={viewMode}
          restoreScrollId="LibraryCollectionScreen"
        />
      )}
      <AddCollectionDialog
        onClose={() => setIsAddCollectionDialogOpened(false)}
        open={isAddCollectionDialogOpened}
      />
    </Stack>
  )
})
