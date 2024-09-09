import { memo, useCallback } from "react"
import List from "@mui/material/List"
import ListItemText from "@mui/material/ListItemText"
import {
  SyncRounded,
  DeleteForeverRounded,
  RemoveRounded,
  CheckRounded,
  CollectionsRounded,
  NoSimRounded,
  LocalOfferRounded,
  ThumbUpOutlined,
  ThumbDownOutlined
} from "@mui/icons-material"
import { useNavigate } from "react-router-dom"
import { useRemoveDownloadFile } from "../../download/useRemoveDownloadFile"
import { ROUTES } from "../../constants.web"
import {
  Drawer,
  Divider,
  ListItemIcon,
  Typography,
  ListItemButton,
  useTheme
} from "@mui/material"
import { useManageBookCollectionsDialog } from "../ManageBookCollectionsDialog"
import { useBookDoc, useIsBookLocal } from "../states"
import { Cover } from "../Cover"
import { ReadingStateState } from "@oboku/shared"
import { useModalNavigationControl } from "../../navigation/useModalNavigationControl"
import { useTranslation } from "react-i18next"
import { useManageBookTagsDialog } from "../ManageBookTagsDialog"
import { useBookDownloadState } from "../../download/states"
import { signal, useLiveRef, useSignalValue } from "reactjrx"
import { useRemoveHandler } from "./useRemoveHandler"
import { getMetadataFromBook } from "../metadata"
import { useRefreshBookMetadata } from "../useRefreshBookMetadata"
import { useIncrementalBookPatch } from "../useIncrementalBookPatch"
import { useLink } from "../../links/states"

type SignalState = {
  openedWith: undefined | string
  actions?: ("removeDownload" | "goToDetails")[]
  actionsBlackList?: ("removeDownload" | "goToDetails")[]
  onDeleteBook?: () => void
}

export const bookActionDrawerSignal = signal<SignalState>({
  key: "bookActionDrawerState",
  default: { openedWith: undefined }
})

export const useBookActionDrawer = ({
  onDeleteBook
}: {
  onDeleteBook?: () => void
} = {}) => {
  const onDeleteBookRef = useLiveRef(onDeleteBook)

  return useCallback(
    (params: Omit<SignalState, "onDeleteBook">) => {
      bookActionDrawerSignal.setValue({
        ...params,
        onDeleteBook: () => {
          onDeleteBookRef.current?.()
        }
      })
    },
    [onDeleteBookRef]
  )
}

export const BookActionsDrawer = memo(() => {
  const { openManageBookCollectionsDialog } = useManageBookCollectionsDialog()
  const { openManageBookTagsDialog } = useManageBookTagsDialog()
  const {
    openedWith: bookId,
    actions,
    onDeleteBook,
    actionsBlackList
  } = useSignalValue(bookActionDrawerSignal)
  const navigate = useNavigate()
  const { data: book } = useBookDoc({ id: bookId })
  const { data: link } = useLink({ id: book?.links[0] })
  const downloadState = useBookDownloadState(bookId || "-1")
  const { data: isLocal } = useIsBookLocal({ id: bookId })
  const { mutate: removeDownloadFile } = useRemoveDownloadFile()
  const refreshBookMetadata = useRefreshBookMetadata()
  const { mutate: incrementalBookPatch } = useIncrementalBookPatch()
  const opened = !!bookId
  const { t } = useTranslation()
  const theme = useTheme()

  const { closeModalWithNavigation: handleClose } = useModalNavigationControl(
    {
      onExit: () => {
        bookActionDrawerSignal.setValue({ openedWith: undefined })
      }
    },
    bookId
  )

  const { mutate: onRemovePress } = useRemoveHandler({
    onSuccess: () => {
      handleClose(() => {
        onDeleteBook?.()
      })
    }
  })

  const metadata = getMetadataFromBook(book)

  return (
    <Drawer anchor="bottom" open={opened} onClose={() => handleClose()}>
      {book && (
        <>
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              marginLeft: theme.spacing(2),
              marginRight: theme.spacing(2),
              marginTop: theme.spacing(2),
              height: 60,
              [theme.breakpoints.up("sm")]: {
                height: 100
              },
              [theme.breakpoints.up("md")]: {
                height: 130
              }
            }}
          >
            <div
              style={{
                width: 60 * theme.custom.coverAverageRatio,
                [theme.breakpoints.up("sm")]: {
                  width: 100 * theme.custom.coverAverageRatio
                },
                [theme.breakpoints.up("md")]: {
                  width: 130 * theme.custom.coverAverageRatio
                },
                height: "100%",
                flexShrink: 0
              }}
            >
              <Cover bookId={book._id} />
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                marginLeft: 10,
                overflow: "hidden"
              }}
            >
              <Typography variant="body1" noWrap>
                {metadata.title}
              </Typography>
              <Typography variant="caption" noWrap>
                {(metadata.authors ?? [])[0]}
              </Typography>
            </div>
          </div>
          <List>
            {(actions?.includes("goToDetails") ||
              (!actions && !actionsBlackList?.includes("goToDetails"))) && (
              <ListItemButton
                onClick={() => {
                  handleClose(() => {
                    navigate(ROUTES.BOOK_DETAILS.replace(":id", book._id))
                  })
                }}
              >
                <ListItemText primary="Go to details" />
              </ListItemButton>
            )}
            {!actions &&
              book.readingStateCurrentState !==
                ReadingStateState.NotStarted && (
                <ListItemButton
                  onClick={() => {
                    handleClose()
                    incrementalBookPatch({
                      doc: book,
                      patch: {
                        readingStateCurrentState: ReadingStateState.NotStarted,
                        readingStateCurrentBookmarkProgressPercent: 0,
                        readingStateCurrentBookmarkProgressUpdatedAt:
                          new Date().toISOString(),
                        readingStateCurrentBookmarkLocation: null
                      }
                    })
                  }}
                >
                  <ListItemIcon>
                    <RemoveRounded />
                  </ListItemIcon>
                  <ListItemText primary="Mark as unread" />
                </ListItemButton>
              )}
            {!actions &&
              book.readingStateCurrentState !== ReadingStateState.Finished && (
                <ListItemButton
                  onClick={() => {
                    handleClose()
                    incrementalBookPatch({
                      doc: book,
                      patch: {
                        readingStateCurrentState: ReadingStateState.Finished,
                        readingStateCurrentBookmarkProgressPercent: 1,
                        readingStateCurrentBookmarkProgressUpdatedAt:
                          new Date().toISOString(),
                        readingStateCurrentBookmarkLocation: null
                      }
                    })
                  }}
                >
                  <ListItemIcon>
                    <CheckRounded />
                  </ListItemIcon>
                  <ListItemText primary="Mark as finished" />
                </ListItemButton>
              )}
            {!actions && (
              <ListItemButton
                onClick={() => {
                  handleClose(() => {
                    incrementalBookPatch({
                      doc: book,
                      patch: {
                        isNotInterested: !book.isNotInterested
                      }
                    })
                  })
                }}
              >
                <ListItemIcon>
                  {book.isNotInterested ? (
                    <ThumbUpOutlined />
                  ) : (
                    <ThumbDownOutlined />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={
                    book.isNotInterested
                      ? "Interested in this book"
                      : "Not interested in this book"
                  }
                />
              </ListItemButton>
            )}
            {!actions && (
              <ListItemButton
                onClick={() => {
                  handleClose(() => {
                    bookId && openManageBookCollectionsDialog(bookId)
                  })
                }}
              >
                <ListItemIcon>
                  <CollectionsRounded />
                </ListItemIcon>
                <ListItemText primary="Manage collections" />
              </ListItemButton>
            )}
            {!actions && (
              <ListItemButton
                onClick={() => {
                  handleClose(() => {
                    bookId && openManageBookTagsDialog(bookId)
                  })
                }}
              >
                <ListItemIcon>
                  <LocalOfferRounded />
                </ListItemIcon>
                <ListItemText primary={t("book.actionDrawer.manageTags")} />
              </ListItemButton>
            )}
            <ListItemButton
              onClick={() => {
                handleClose()
                refreshBookMetadata(book._id)
              }}
              disabled={!link}
            >
              <ListItemIcon>
                <SyncRounded />
              </ListItemIcon>
              <ListItemText primary="Refresh metadata" />
            </ListItemButton>
            {(actions?.includes("removeDownload") || !actions) &&
              downloadState?.downloadState === "downloaded" &&
              !isLocal && (
                <ListItemButton
                  onClick={() => {
                    handleClose()
                    bookId && removeDownloadFile({ bookId })
                  }}
                >
                  <ListItemIcon>
                    <NoSimRounded />
                  </ListItemIcon>
                  <ListItemText primary="Remove the book download" />
                </ListItemButton>
              )}
            {/* {(actions?.includes('removeDownload') || !actions) && (book.downloadState === 'downloaded' && book.isLocal) && (
              <ListItem button
                onClick={() => {
                  handleClose()
                  bookId && removeBook({ id: bookId })
                }}
              >
                <ListItemIcon>
                  <DeleteForeverRounded />
                </ListItemIcon>
                <ListItemText
                  primary="Remove the book"
                  secondary="This book is local, removing its content will remove it from your library as well"
                />
              </ListItem>
            )} */}
          </List>
          {!actions && (
            <>
              <Divider />
              <List>
                <ListItemButton
                  onClick={() => bookId && onRemovePress({ bookId })}
                >
                  <ListItemIcon>
                    <DeleteForeverRounded />
                  </ListItemIcon>
                  <ListItemText primary="Remove from library" />
                </ListItemButton>
              </List>
            </>
          )}
        </>
      )}
    </Drawer>
  )
})
