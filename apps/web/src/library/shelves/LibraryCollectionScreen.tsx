import { useState, useMemo, useCallback, type ComponentProps } from "react"
import { Button, Stack, Toolbar as MuiToolbar } from "@mui/material"
import { useNavigate } from "react-router"
import { CollectionList } from "../../collections/lists/CollectionList"
import { signal, useSignalValue } from "reactjrx"
import { useLibraryShelves } from "./useLibraryShelves"
import { Toolbar } from "./Toolbar"
import { libraryShelvesFiltersSignal } from "./filters/states"
import type { CollectionDocType } from "@oboku/shared"
import type { DeepReadonlyObject } from "rxdb"
import { AddCollectionDialog } from "./AddCollectionDialog"
import { ROUTES } from "../../navigation/routes"

type RestoreStateFromState =
  | Parameters<
      NonNullable<ComponentProps<typeof CollectionList>["onStateChange"]>
    >[0]
  | undefined

const libraryCollectionScreenPreviousScrollState =
  signal<RestoreStateFromState>({
    key: "libraryCollectionScreenPreviousScrollState",
  })

export const LibraryCollectionScreen = () => {
  const navigate = useNavigate()
  const [isAddCollectionDialogOpened, setIsAddCollectionDialogOpened] =
    useState(false)
  const libraryCollectionScreenPreviousScroll = useSignalValue(
    libraryCollectionScreenPreviousScrollState,
  )
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
      <Toolbar />
      {!!collections && (
        <CollectionList
          style={{
            flex: 1,
          }}
          data={collections}
          renderHeader={listRenderHeader}
          onItemClick={onItemClick}
          viewMode={viewMode}
          onStateChange={libraryCollectionScreenPreviousScrollState.update}
          restoreStateFrom={libraryCollectionScreenPreviousScroll}
          restoreScrollId="libraryShelves"
        />
      )}
      <AddCollectionDialog
        onClose={() => setIsAddCollectionDialogOpened(false)}
        open={isAddCollectionDialogOpened}
      />
    </Stack>
  )
}
