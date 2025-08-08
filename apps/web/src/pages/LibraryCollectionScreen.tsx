import { useState, useMemo, useCallback, memo } from "react"
import { Button, Stack, Toolbar as MuiToolbar } from "@mui/material"
import { CollectionList } from "../collections/lists/CollectionList"
import { useSignalValue } from "reactjrx"
import { useLibraryShelves } from "../library/shelves/useLibraryShelves"
import { Toolbar } from "../library/shelves/Toolbar"
import { libraryShelvesFiltersSignal } from "../library/shelves/filters/states"
import { AddCollectionDialog } from "../library/shelves/AddCollectionDialog"

export const LibraryCollectionScreen = memo(() => {
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
