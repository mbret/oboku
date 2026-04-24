import { useState, useMemo, useCallback, memo } from "react"
import { Box, Button, Stack } from "@mui/material"
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
      <Box
        sx={{
          p: 2,
          pt: 1,
        }}
      >
        <Button
          fullWidth
          variant="outlined"
          onClick={() => setIsAddCollectionDialogOpened(true)}
        >
          Create a new collection
        </Button>
      </Box>
    ),
    [],
  )

  const listRenderHeader = useCallback(() => listHeader, [listHeader])

  return (
    <Stack
      sx={{
        flex: 1,
        overflow: "hidden",
      }}
    >
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
