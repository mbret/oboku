import {
  Drawer,
  ListItem,
  Divider,
  List,
  ListItemIcon,
  ListItemText,
  ListItemButton
} from "@mui/material"
import { useState, FC } from "react"
import {
  Edit,
  DeleteForeverRounded,
  LibraryAddRounded,
  ThumbDownOutlined,
  ThumbUpOutlined
} from "@mui/icons-material"
import { ManageCollectionBooksDialog } from "../../../collections/ManageCollectionBooksDialog"
import { useModalNavigationControl } from "../../../navigation/useModalNavigationControl"
import { useSignalValue } from "reactjrx"
import { useRemoveCollection } from "../../../collections/useRemoveCollection"
import {
  collectionActionDrawerChangesState,
  collectionActionDrawerState
} from "./useCollectionActionsDrawer"
import { useUpdateCollectionBooks } from "../../../collections/useUpdateCollectionBooks"
import { EditCollectionDialog } from "./EditCollectionDialog"

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
          <ListItemButton onClick={() => onRemoveCollection(collectionId)}>
            <ListItemIcon>
              <DeleteForeverRounded />
            </ListItemIcon>
            <ListItemText primary="Remove" />
          </ListItemButton>
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
