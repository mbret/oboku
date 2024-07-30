import { useState, FC, useMemo, useCallback, ComponentProps } from "react"
import Dialog from "@mui/material/Dialog"
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Toolbar
} from "@mui/material"
import { ROUTES } from "../../constants"
import { useNavigate } from "react-router-dom"
import { useMeasureElement } from "../../common/utils"
import { CollectionList } from "../../collections/list/CollectionList"
import { useDebouncedCallback } from "use-debounce"
import { signal, useSignalValue } from "reactjrx"
import { useShelves } from "./useShelves"
import { FilterBar } from "./FilterBar"
import { useCreateCollection } from "../../collections/useCreateCollection"
import { collectionsListSignal } from "./state"
import { CollectionDocType } from "@oboku/shared"
import { DeepReadonlyObject } from "rxdb"

type Scroll = Parameters<
  NonNullable<ComponentProps<typeof CollectionList>["onScroll"]>
>[0]

const libraryCollectionScreenPreviousScrollState = signal<Scroll>({
  key: `libraryCollectionScreenPreviousScrollState`,
  default: {
    horizontalScrollDirection: `backward`,
    scrollLeft: 0,
    scrollTop: 0,
    scrollUpdateWasRequested: false,
    verticalScrollDirection: `forward`
  }
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
  const { data: collections = [] } = useShelves()

  const onScroll = useDebouncedCallback((value: Scroll) => {
    libraryCollectionScreenPreviousScrollState.setValue(value)
  }, 300)
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

  const [listHeaderDimTracker, { height: listHeaderHeight }] =
    useMeasureElement(listHeader)

  const onItemClick = useCallback(
    (item: DeepReadonlyObject<CollectionDocType>) => {
      navigate(ROUTES.COLLECTION_DETAILS.replace(":id", item._id))
    },
    [navigate]
  )

  return (
    <Stack flex={1} overflow="hidden">
      {listHeaderDimTracker}
      <FilterBar />
      <CollectionList
        style={{
          flex: 1
        }}
        data={collections}
        headerHeight={listHeaderHeight}
        renderHeader={listRenderHeader}
        onItemClick={onItemClick}
        onScroll={onScroll}
        viewMode={viewMode}
        initialScrollLeft={libraryCollectionScreenPreviousScroll.scrollLeft}
        initialScrollTop={libraryCollectionScreenPreviousScroll.scrollTop}
      />
      <AddCollectionDialog
        onClose={() => setIsAddCollectionDialogOpened(false)}
        open={isAddCollectionDialogOpened}
      />
    </Stack>
  )
}

const AddCollectionDialog: FC<{
  open: boolean
  onClose: () => void
}> = ({ onClose, open }) => {
  const [name, setName] = useState("")
  const { mutate: addCollection } = useCreateCollection()

  const onInnerClose = () => {
    setName("")
    onClose()
  }

  return (
    <Dialog onClose={onInnerClose} open={open}>
      <DialogTitle>Create a new collection</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          id="name"
          label="Name"
          type="text"
          fullWidth
          margin="normal"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onInnerClose} color="primary">
          Cancel
        </Button>
        <Button
          onClick={() => {
            onInnerClose()
            if (name) {
              addCollection({ name })
            }
          }}
          color="primary"
        >
          Add
        </Button>
      </DialogActions>
    </Dialog>
  )
}
