import { memo, useCallback } from "react"
import List from "@mui/material/List"
import ListItem from "@mui/material/ListItem"
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
import { ROUTES } from "../../constants"
import { useAtomicUpdateBook, useRefreshBookMetadata } from "../helpers"
import {
  Drawer,
  Divider,
  ListItemIcon,
  Typography,
  ListItemButton
} from "@mui/material"
import makeStyles from "@mui/styles/makeStyles"
import { useManageBookCollectionsDialog } from "../ManageBookCollectionsDialog"
import { useBook, useIsBookLocal } from "../states"
import { Cover } from "../Cover"
import { ReadingStateState } from "@oboku/shared"
import { Report } from "../../debug/report.shared"
import { useModalNavigationControl } from "../../navigation/useModalNavigationControl"
import { useTranslation } from "react-i18next"
import { useManageBookTagsDialog } from "../ManageBookTagsDialog"
import { markAsInterested } from "../triggers"
import {
  booksDownloadStateSignal,
  useBookDownloadState
} from "../../download/states"
import { signal, useLiveRef, useSignalValue } from "reactjrx"
import { useRemoveHandler } from "./useRemoveHandler"
import { getMetadataFromBook } from "../getMetadataFromBook"

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
  const { data: book } = useBook({ id: bookId })
  const downloadState = useBookDownloadState(bookId || "-1")
  const { data: isLocal } = useIsBookLocal({ id: bookId })
  const removeDownloadFile = useRemoveDownloadFile()
  const refreshBookMetadata = useRefreshBookMetadata()
  const [updateBook] = useAtomicUpdateBook()
  const classes = useStyles()
  const opened = !!bookId
  const { t } = useTranslation()

  const { closeModalWithNavigation: handleClose } = useModalNavigationControl(
    {
      onExit: () => {
        bookActionDrawerSignal.setValue({ openedWith: undefined })
      }
    },
    bookId
  )

  const { mutate: onRemovePress, ...rest } = useRemoveHandler({
    onError: () => {
      handleClose()
    },
    onSuccess: ({ isDeleted }) => {
      if (isDeleted) {
        handleClose(() => {
          onDeleteBook?.()
        })
      }
    }
  })

  const metadata = getMetadataFromBook(book)

  return (
    <Drawer anchor="bottom" open={opened} onClose={() => handleClose()}>
      {book && (
        <>
          <div className={classes.topContainer}>
            <div className={classes.coverContainer}>
              <Cover bookId={book._id} />
            </div>
            <div className={classes.topDetails}>
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
                    updateBook(book._id, (old) => ({
                      ...old,
                      readingStateCurrentState: ReadingStateState.NotStarted,
                      readingStateCurrentBookmarkProgressPercent: 0,
                      readingStateCurrentBookmarkProgressUpdatedAt:
                        new Date().toISOString(),
                      readingStateCurrentBookmarkLocation: null
                    })).catch(Report.error)
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
                    updateBook(book._id, (old) => ({
                      ...old,
                      readingStateCurrentState: ReadingStateState.Finished,
                      readingStateCurrentBookmarkProgressPercent: 1,
                      readingStateCurrentBookmarkProgressUpdatedAt:
                        new Date().toISOString(),
                      readingStateCurrentBookmarkLocation: null
                    })).catch(Report.error)
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
                    bookId &&
                      markAsInterested({
                        id: bookId,
                        isNotInterested: !book.isNotInterested
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
                    bookId && removeDownloadFile(bookId)
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
                <ListItem
                  button
                  onClick={() => bookId && onRemovePress({ bookId })}
                >
                  <ListItemIcon>
                    <DeleteForeverRounded />
                  </ListItemIcon>
                  <ListItemText primary="Remove from library" />
                </ListItem>
              </List>
            </>
          )}
        </>
      )}
    </Drawer>
  )
})

const useStyles = makeStyles((theme) => ({
  topContainer: {
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
  },
  coverContainer: {
    width: 60 * theme.custom.coverAverageRatio,
    [theme.breakpoints.up("sm")]: {
      width: 100 * theme.custom.coverAverageRatio
    },
    [theme.breakpoints.up("md")]: {
      width: 130 * theme.custom.coverAverageRatio
    },
    height: "100%",
    flexShrink: 0
  },
  topDetails: {
    display: "flex",
    flexDirection: "column",
    marginLeft: 10,
    overflow: "hidden"
  }
}))
