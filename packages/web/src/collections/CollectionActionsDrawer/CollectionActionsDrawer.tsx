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
  ThumbUpOutlined,
  SyncRounded
} from "@mui/icons-material"
import { useSignalValue } from "reactjrx"
import {
  collectionActionDrawerChangesState,
  collectionActionDrawerState
} from "./useCollectionActionsDrawer"
import { RenameCollectionDialog } from "./RenameCollectionDialog"
import { differenceInMinutes } from "date-fns"
import { COLLECTION_METADATA_LOCK_MN } from "@oboku/shared"
import { useModalNavigationControl } from "../../navigation/useModalNavigationControl"
import { ManageCollectionBooksDialog } from "../ManageCollectionBooksDialog"
import { useCollection } from "../states"
import { useRefreshCollectionMetadata } from "../useRefreshCollectionMetadata"
import { useRemoveCollection } from "../useRemoveCollection"
import { useUpdateCollectionBooks } from "../useUpdateCollectionBooks"

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
  const { mutate: refreshCollectionMetadata, ...rest } =
    useRefreshCollectionMetadata()
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
  const { data: collection } = useCollection({ id: collectionId })
  const opened = !!collectionId

  const onRemoveCollection = (id: string) => {
    closeModalWithNavigation()
    collectionActionDrawerChangesState.setValue([id, `delete`])
    id && removeCollection({ _id: id })
  }

  const isRefreshingMetadata = !!(
    collection?.metadataUpdateStatus === "fetching" &&
    collection.lastMetadataStartedAt &&
    differenceInMinutes(new Date(), collection.lastMetadataStartedAt) <
      COLLECTION_METADATA_LOCK_MN
  )

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
          {collection?.type === "series" && (
            <ListItemButton
              onClick={() => {
                refreshCollectionMetadata(collectionId)
              }}
              disabled={isRefreshingMetadata}
            >
              <ListItemIcon>
                <SyncRounded />
              </ListItemIcon>
              <ListItemText
                primary={
                  isRefreshingMetadata
                    ? "Refreshing metadata..."
                    : "Refresh metadata"
                }
              />
            </ListItemButton>
          )}
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
      <RenameCollectionDialog
        openWith={isEditCollectionDialogOpenedWithId}
        onClose={() => {
          setIsEditCollectionDialogOpenedWithId(undefined)
        }}
      />
    </>
  )
}
