import {
  Drawer,
  Divider,
  List,
  ListItemIcon,
  ListItemText,
  ListItemButton,
} from "@mui/material"
import { memo, useState } from "react"
import {
  Edit,
  DeleteForeverRounded,
  LibraryAddRounded,
  ThumbDownOutlined,
  ThumbUpOutlined,
  SyncRounded,
  CheckRounded,
} from "@mui/icons-material"
import { useSignalValue } from "reactjrx"
import {
  collectionActionDrawerChangesState,
  collectionActionDrawerState,
} from "./useCollectionActionsDrawer"
import { RenameCollectionDialog } from "./RenameCollectionDialog"
import { differenceInMinutes } from "date-fns"
import { COLLECTION_METADATA_LOCK_MN } from "@oboku/shared"
import { useModalNavigationControl } from "../../navigation/useModalNavigationControl"
import { ManageCollectionBooksDialog } from "../ManageCollectionBooksDialog"
import { useRefreshCollectionMetadata } from "../useRefreshCollectionMetadata"
import { useRemoveCollection } from "../useRemoveCollection"
import { useUpdateCollectionBooks } from "../useUpdateCollectionBooks"
import { useCollection } from "../useCollection"
import { configuration } from "../../config/configuration"
// import { useRefreshBookMetadata } from "../../books/useRefreshBookMetadata"
import { useCollectionReadingProgress } from "../useCollectionReadingProgress"
import { useMarkBookAsFinished } from "../../books/useMarkBookAs"

export const CollectionActionsDrawer = memo(() => {
  const { openedWith, lastId: collectionId } = useSignalValue(
    collectionActionDrawerState,
  )
  const [
    isEditCollectionDialogOpenedWithId,
    setIsEditCollectionDialogOpenedWithId,
  ] = useState<string | undefined>(undefined)
  const { mutate: removeCollection } = useRemoveCollection()
  const [isManageBookDialogOpened, setIsManageBookDialogOpened] =
    useState(false)
  // const refreshBookMetadata = useRefreshBookMetadata()
  const { mutate: refreshCollectionMetadata } = useRefreshCollectionMetadata()
  const subActionOpened = !!isEditCollectionDialogOpenedWithId
  const { mutate: updateCollectionBooks } = useUpdateCollectionBooks()
  const markBookAsFinished = useMarkBookAsFinished()
  const { closeModalWithNavigation } = useModalNavigationControl(
    {
      onExit: () => {
        collectionActionDrawerState.setValue({
          openedWith: undefined,
          lastId: collectionId,
        })

        setIsEditCollectionDialogOpenedWithId(undefined)
        setIsManageBookDialogOpened(false)
      },
    },
    openedWith,
  )
  const { data: collection } = useCollection({ id: collectionId })
  const collectionReadingProgress = useCollectionReadingProgress({
    id: collectionId,
  })
  const isCollectionFinished =
    collectionReadingProgress !== undefined
      ? collectionReadingProgress >= 1
      : undefined

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

  return (
    <>
      <Drawer
        anchor="bottom"
        open={!!openedWith && !subActionOpened}
        onClose={() => closeModalWithNavigation()}
      >
        <List>
          <ListItemButton
            onClick={() => {
              setIsEditCollectionDialogOpenedWithId(collectionId)
            }}
          >
            <ListItemIcon>
              <Edit />
            </ListItemIcon>
            <ListItemText primary="Rename" />
          </ListItemButton>

          <ListItemButton
            onClick={() => {
              setIsManageBookDialogOpened(true)
            }}
          >
            <ListItemIcon>
              <LibraryAddRounded />
            </ListItemIcon>
            <ListItemText primary="Manage books" />
          </ListItemButton>
          {collection &&
            collection._id !== configuration.COLLECTION_EMPTY_ID && (
              <ListItemButton
                onClick={() => {
                  refreshCollectionMetadata(collectionId ?? ``)
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
          {isCollectionFinished !== undefined && !isCollectionFinished && (
            <ListItemButton
              onClick={() => {
                closeModalWithNavigation()
                collection?.books.forEach((id) => {
                  markBookAsFinished(id)
                })
              }}
            >
              <ListItemIcon>
                <CheckRounded />
              </ListItemIcon>
              <ListItemText primary="Mark all books as finished" />
            </ListItemButton>
          )}
          <ListItemButton
            onClick={() => {
              closeModalWithNavigation()
              updateCollectionBooks({
                id: collectionId ?? ``,
                updateObj: {
                  $set: {
                    isNotInterested: true,
                  },
                },
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
                id: collectionId ?? ``,
                updateObj: {
                  $set: {
                    isNotInterested: false,
                  },
                },
              })
            }}
          >
            <ListItemIcon>
              <ThumbUpOutlined />
            </ListItemIcon>
            <ListItemText primary="Mark all books as interested" />
          </ListItemButton>
          {/* <ListItemButton
            onClick={() => {
              closeModalWithNavigation()
              collection?.books.forEach((id) => {
                refreshBookMetadata(id)
              })
            }}
          >
            <ListItemIcon>
              <SyncRounded />
            </ListItemIcon>
            <ListItemText primary="Refresh all books metadata" />
          </ListItemButton> */}
        </List>
        <Divider />
        <List>
          <ListItemButton
            onClick={() => onRemoveCollection(collectionId ?? ``)}
          >
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
})
