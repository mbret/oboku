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
import { generatePath, useNavigate } from "react-router"
import {
  collectionActionDrawerChangesState,
  collectionActionDrawerState,
} from "./useCollectionActionsDrawer"
import { RenameCollectionDialog } from "./RenameCollectionDialog"
import { useDismissibleOverlay } from "../../navigation/modalHistory"
import { ROUTES } from "../../navigation/routes"
import { useRefreshCollectionMetadata } from "../useRefreshCollectionMetadata"
import { useIsCollectionMetadataRefreshing } from "../useIsCollectionMetadataRefreshing"
import { useRemoveCollection } from "../useRemoveCollection"
import { useUpdateCollectionBooks } from "../useUpdateCollectionBooks"
import { useCollection } from "../useCollection"
import { useConfig } from "../../config/useConfig"
import { useCollectionReadingProgress } from "../useCollectionReadingProgress"
import { useMarkBooksAsFinished } from "../../books/useMarkBookAs"
import { useResolvedMetadataFetchEnabled } from "../../metadata/useResolvedMetadataFetchEnabled"

export const CollectionActionsDrawer = memo(function CollectionActionsDrawer() {
  const { openedWith, lastId: collectionId } = useSignalValue(
    collectionActionDrawerState,
  )
  const [
    isEditCollectionDialogOpenedWithId,
    setIsEditCollectionDialogOpenedWithId,
  ] = useState<string | undefined>(undefined)
  const { mutate: removeCollection } = useRemoveCollection()
  const navigate = useNavigate()
  const { mutate: refreshCollectionMetadata } = useRefreshCollectionMetadata()
  const subActionOpened = !!isEditCollectionDialogOpenedWithId
  const { mutate: updateCollectionBooks } = useUpdateCollectionBooks()
  const { mutate: markBooksAsFinished } = useMarkBooksAsFinished()
  const { close: closeModalWithNavigation } = useDismissibleOverlay({
    open: !!openedWith,
    onClose: () => {
      collectionActionDrawerState.update({
        openedWith: undefined,
        lastId: collectionId,
      })

      setIsEditCollectionDialogOpenedWithId(undefined)
    },
  })
  const { data: config } = useConfig()
  const { data: collection } = useCollection({ id: collectionId })
  const collectionReadingProgress = useCollectionReadingProgress({
    id: collectionId,
  })
  const isCollectionFinished =
    collectionReadingProgress !== undefined
      ? collectionReadingProgress >= 1
      : undefined
  const { resolved: metadataFetchResolved } = useResolvedMetadataFetchEnabled({
    kind: "collection",
    collection,
  })
  const metadataFetchDisabled = metadataFetchResolved === false

  const onRemoveCollection = (id: string) => {
    closeModalWithNavigation()
    collectionActionDrawerChangesState.update([id, `delete`])
    id && removeCollection({ _id: id })
  }

  const isRefreshingMetadata = useIsCollectionMetadataRefreshing(collection)

  const isCollectionFromLibrarySync = !!collection?.linkType
  const canRemoveCollection = !!collection && !isCollectionFromLibrarySync

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

          {collection && collection._id !== config?.COLLECTION_EMPTY_ID && (
            <ListItemButton
              onClick={() => {
                closeModalWithNavigation(() => {
                  navigate(
                    generatePath(ROUTES.COLLECTION_BOOKS, {
                      id: collectionId ?? `-1`,
                    }),
                  )
                })
              }}
            >
              <ListItemIcon>
                <LibraryAddRounded />
              </ListItemIcon>
              <ListItemText primary="Manage books" />
            </ListItemButton>
          )}
          {collection && collection._id !== config?.COLLECTION_EMPTY_ID && (
            <ListItemButton
              onClick={() => {
                refreshCollectionMetadata(collectionId ?? ``)
              }}
              disabled={isRefreshingMetadata || metadataFetchDisabled}
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
                secondary={
                  metadataFetchDisabled
                    ? "Disabled by metadata fetching policy"
                    : undefined
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
                markBooksAsFinished({
                  bookIds: collection?.books ?? [],
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
        </List>
        <Divider />
        <List>
          <ListItemButton
            onClick={() => onRemoveCollection(collectionId ?? ``)}
            disabled={!canRemoveCollection}
          >
            <ListItemIcon>
              <DeleteForeverRounded />
            </ListItemIcon>
            <ListItemText
              primary="Remove"
              secondary={
                isCollectionFromLibrarySync
                  ? "Managed by its library sync"
                  : undefined
              }
            />
          </ListItemButton>
        </List>
      </Drawer>
      <RenameCollectionDialog
        openWith={isEditCollectionDialogOpenedWithId}
        onClose={() => {
          setIsEditCollectionDialogOpenedWithId(undefined)
        }}
      />
    </>
  )
})
