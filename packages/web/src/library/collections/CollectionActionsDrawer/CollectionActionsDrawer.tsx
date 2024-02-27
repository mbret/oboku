import {
  Drawer,
  ListItem,
  Divider,
  List,
  ListItemIcon,
  ListItemText,
  DialogContent,
  DialogTitle,
  Dialog,
  TextField,
  DialogActions,
  Button,
  ListItemButton
} from "@mui/material"
import { useEffect, useState, FC } from "react"
import {
  Edit,
  DeleteForeverRounded,
  LibraryAddRounded,
  ThumbDownOutlined,
  ThumbUpOutlined
} from "@mui/icons-material"
import { useCollection } from "../../../collections/states"
import { ManageCollectionBooksDialog } from "../../../collections/ManageCollectionBooksDialog"
import { useModalNavigationControl } from "../../../navigation/useModalNavigationControl"
import { libraryStateSignal } from "../../states"
import { useSignalValue } from "reactjrx"
import { useRemoveCollection } from "../../../collections/useRemoveCollection"
import { useUpdateCollection } from "../../../collections/useUpdateCollection"
import {
  collectionActionDrawerChangesState,
  collectionActionDrawerState
} from "./useCollectionActionsDrawer"
import { useUpdateBooks } from "../../../books/useUpdateBooks"
import { useUpdateCollectionBooks } from "../../../collections/useUpdateCollectionBooks"

export const CollectionActionsDrawer: FC<{}> = () => {
  const { openedWith: collectionId } = useSignalValue(
    collectionActionDrawerState
  )
  const [
    isEditCollectionDialogOpenedWithId,
    setIsEditCollectionDialogOpenedWithId
  ] = useState<string | undefined>(undefined)
  const { mutate: removeCollection } = useRemoveCollection()
  const [isManageBookDialogOpened, setIsManageBookDialogOpened] =
    useState(false)
  const subActionOpened = !!isEditCollectionDialogOpenedWithId
  const { mutate: updateCollectionBooks } = useUpdateCollectionBooks()
  const { closeModalWithNavigation } = useModalNavigationControl(
    {
      onExit: () => {
        collectionActionDrawerState.setValue({ openedWith: undefined })
        setIsEditCollectionDialogOpenedWithId(undefined)
        setIsManageBookDialogOpened(false)
      }
    },
    collectionId
  )

  const opened = !!collectionId

  const onRemoveCollection = (id: string) => {
    closeModalWithNavigation()
    collectionActionDrawerChangesState.setValue([id, `delete`])
    id && removeCollection({ _id: id })
  }

  if (!collectionId) return null

  return (
    <>
      <Drawer
        anchor="bottom"
        open={opened && !subActionOpened}
        onClose={() => closeModalWithNavigation()}
      >
        <List>
          <ListItem
            button
            onClick={() => {
              setIsEditCollectionDialogOpenedWithId(collectionId)
            }}
          >
            <ListItemIcon>
              <Edit />
            </ListItemIcon>
            <ListItemText primary="Rename" />
          </ListItem>
          {/* <ListItem button onClick={() => {
            // delete this collection
            // create a new local one without resource id
          }}>
            <ListItemIcon><DynamicFeedRounded /></ListItemIcon>
            <ListItemText
              primary="Make this collection local"
              secondary="This collection will no longer be synchronized with the data source it originated from"
            />
          </ListItem> */}
          <ListItemButton
            onClick={() => {
              closeModalWithNavigation()
              updateCollectionBooks({
                id: collectionId,
                updateObj: {
                  $set: {
                    isNotInterested: true
                  }
                }
              })
            }}
          >
            <ListItemIcon>
              <ThumbDownOutlined />
            </ListItemIcon>
            <ListItemText primary="Mark all books as not interested" />
          </ListItemButton>
          <ListItemButton
            onClick={() => {
              closeModalWithNavigation()
              updateCollectionBooks({
                id: collectionId,
                updateObj: {
                  $set: {
                    isNotInterested: false
                  }
                }
              })
            }}
          >
            <ListItemIcon>
              <ThumbUpOutlined />
            </ListItemIcon>
            <ListItemText primary="Mark all books as interested" />
          </ListItemButton>
          <ListItem
            button
            onClick={() => {
              setIsManageBookDialogOpened(true)
            }}
          >
            <ListItemIcon>
              <LibraryAddRounded />
            </ListItemIcon>
            <ListItemText primary="Manage books" />
          </ListItem>
        </List>
        <Divider />
        <List>
          <ListItem button onClick={() => onRemoveCollection(collectionId)}>
            <ListItemIcon>
              <DeleteForeverRounded />
            </ListItemIcon>
            <ListItemText primary="Remove" />
          </ListItem>
        </List>
      </Drawer>
      <ManageCollectionBooksDialog
        open={isManageBookDialogOpened}
        onClose={() => {
          setIsManageBookDialogOpened(false)
        }}
        collectionId={collectionId}
      />
      <EditCollectionDialog
        id={isEditCollectionDialogOpenedWithId}
        onClose={() => {
          setIsEditCollectionDialogOpenedWithId(undefined)
        }}
        open={!!isEditCollectionDialogOpenedWithId}
      />
    </>
  )
}

const EditCollectionDialog: FC<{
  open: boolean
  id: string | undefined
  onClose: () => void
}> = ({ onClose, open, id }) => {
  const [name, setName] = useState("")
  const libraryState = useSignalValue(libraryStateSignal)
  const { data: collection } = useCollection({
    id
  })
  const { mutate: editCollection } = useUpdateCollection()

  const onInnerClose = () => {
    setName("")
    onClose()
  }

  const onConfirm = (id: string, name: string) => {
    if (name) {
      editCollection({ _id: id, name })
    }
  }

  useEffect(() => {
    setName((prev) => collection?.name || prev)
  }, [collection?.name, id])

  return (
    <Dialog onClose={onInnerClose} open={open}>
      <DialogTitle>Collection: {collection?.name}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          id="name"
          label="Name"
          type="text"
          fullWidth
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
            id && onConfirm(id, name)
          }}
          color="primary"
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}
