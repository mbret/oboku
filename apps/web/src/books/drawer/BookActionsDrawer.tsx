import { memo, useCallback } from "react"
import List from "@mui/material/List"
import ListItemText from "@mui/material/ListItemText"
import {
  SyncRounded,
  DeleteForeverRounded,
  CollectionsRounded,
  NoSimRounded,
  LocalOfferRounded,
  ThumbUpOutlined,
  ThumbDownOutlined,
} from "@mui/icons-material"
import { useNavigate } from "react-router"
import { useRemoveDownloadFile } from "../../download/useRemoveDownloadFile"
import {
  Drawer,
  Divider,
  ListItemIcon,
  Typography,
  ListItemButton,
  useTheme,
} from "@mui/material"
import { useBook, useIsBookLocal } from "../states"
import { Cover } from "../Cover"
import { ReadingStateState } from "@oboku/shared"
import { useModalNavigationControl } from "../../navigation/useModalNavigationControl"
import { useBookDownloadState } from "../../download/states"
import { signal, useLiveRef, useSignalValue } from "reactjrx"
import { useRemoveHandler } from "../useRemoveHandler"
import { getMetadataFromBook } from "../metadata"
import { useRefreshBookMetadata } from "../useRefreshBookMetadata"
import { useIncrementalBookPatch } from "../useIncrementalBookPatch"
import { useLink } from "../../links/states"
import { ROUTES } from "../../navigation/routes"
import { useMarkBooksAsFinished, useMarkBooksAsUnread } from "../useMarkBookAs"
import { MarkAsReadIcon, UnreadIcon } from "../../common/icon"
import { useResolvedMetadataFetchEnabled } from "../../metadata/useResolvedMetadataFetchEnabled"

type SignalState = {
  openedWith: undefined | string
  actions?: ("removeDownload" | "goToDetails")[]
  actionsBlackList?: ("removeDownload" | "goToDetails")[]
  onDeleteBook?: () => void
}

export const bookActionDrawerSignal = signal<SignalState>({
  key: "bookActionDrawerState",
  default: { openedWith: undefined },
})

export const useBookActionDrawer = ({
  onDeleteBook,
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
        },
      })
    },
    [onDeleteBookRef],
  )
}

export const BookActionsDrawer = memo(() => {
  const {
    openedWith: bookId,
    actions,
    onDeleteBook,
    actionsBlackList,
  } = useSignalValue(bookActionDrawerSignal)
  const navigate = useNavigate()
  const { data: book } = useBook({ id: bookId })
  const { data: link } = useLink({ id: book?.links[0] })
  const downloadState = useBookDownloadState(bookId || "-1")
  const { data: isLocal } = useIsBookLocal({ id: bookId })
  const { mutate: removeDownloadFile } = useRemoveDownloadFile()
  const refreshBookMetadata = useRefreshBookMetadata()
  const { mutate: incrementalBookPatch } = useIncrementalBookPatch()
  const { mutate: markBooksAsUnread } = useMarkBooksAsUnread()
  const { mutate: markBooksAsFinished } = useMarkBooksAsFinished()
  const opened = !!bookId
  const theme = useTheme()
  const { resolved: metadataFetchResolved } = useResolvedMetadataFetchEnabled({
    kind: "book",
    book,
  })
  const metadataFetchDisabled = metadataFetchResolved === false

  const { closeModalWithNavigation: handleClose } = useModalNavigationControl(
    {
      onExit: () => {
        bookActionDrawerSignal.setValue({ openedWith: undefined })
      },
    },
    bookId,
  )

  const { mutate: onRemovePress } = useRemoveHandler({
    onSuccess: () => {
      handleClose(() => {
        onDeleteBook?.()
      })
    },
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
                height: 100,
              },
              [theme.breakpoints.up("md")]: {
                height: 130,
              },
            }}
          >
            <div
              style={{
                width: 60 * theme.custom.coverAverageRatio,
                [theme.breakpoints.up("sm")]: {
                  width: 100 * theme.custom.coverAverageRatio,
                },
                [theme.breakpoints.up("md")]: {
                  width: 130 * theme.custom.coverAverageRatio,
                },
                height: "100%",
                flexShrink: 0,
              }}
            >
              <Cover bookId={book._id} />
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                marginLeft: 10,
                overflow: "hidden",
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
                    markBooksAsUnread({ bookIds: [book._id] })
                  }}
                >
                  <ListItemIcon>
                    <UnreadIcon />
                  </ListItemIcon>
                  <ListItemText primary="Mark as unread" />
                </ListItemButton>
              )}
            {!actions &&
              book.readingStateCurrentState !== ReadingStateState.Finished && (
                <ListItemButton
                  onClick={() => {
                    handleClose()
                    markBooksAsFinished({ bookIds: [book._id] })
                  }}
                >
                  <ListItemIcon>
                    <MarkAsReadIcon />
                  </ListItemIcon>
                  <ListItemText primary="Mark as finished" />
                </ListItemButton>
              )}
            {!actions && (
              <ListItemButton
                onClick={() => {
                  handleClose(() => {
                    incrementalBookPatch({
                      doc: book._id,
                      patch: {
                        isNotInterested: !book.isNotInterested,
                      },
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
                    if (bookId) {
                      navigate(ROUTES.BOOK_COLLECTIONS.replace(":id", bookId))
                    }
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
                    if (bookId) {
                      navigate(ROUTES.BOOK_TAGS.replace(":id", bookId))
                    }
                  })
                }}
              >
                <ListItemIcon>
                  <LocalOfferRounded />
                </ListItemIcon>
                <ListItemText primary="Manage tags" />
              </ListItemButton>
            )}
            <ListItemButton
              onClick={() => {
                handleClose()
                refreshBookMetadata(book._id)
              }}
              disabled={!link || metadataFetchDisabled}
            >
              <ListItemIcon>
                <SyncRounded />
              </ListItemIcon>
              <ListItemText
                primary="Refresh metadata"
                secondary={
                  metadataFetchDisabled
                    ? "Disabled by metadata fetching policy"
                    : undefined
                }
              />
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
                  onClick={() => bookId && onRemovePress({ bookIds: [bookId] })}
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
