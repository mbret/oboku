
import React, { useCallback } from 'react';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import { SyncRounded, DeleteForeverRounded, RemoveRounded, CheckRounded, CollectionsRounded, NoSimRounded } from '@material-ui/icons';
import { useHistory } from 'react-router-dom';
import { useRemoveDownloadFile } from '../download/useRemoveDownloadFile';
import { ROUTES } from '../constants';
import { useAtomicUpdateBook, useRefreshBookMetadata } from './helpers';
import { useRemoveBook } from './helpers';
import { Drawer, Divider, ListItemIcon, Typography, makeStyles } from '@material-ui/core';
import { openManageBookCollectionsDialog } from './ManageBookCollectionsDialog';
import { atom, useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { enrichedBookState } from './states';
import { Cover } from './Cover';
import { ReadingStateState } from '@oboku/shared';
import { Report } from '../report';
import { useModalNavitationControl } from '../navigation/helpers';

export const bookActionDrawerState = atom<{
  openedWith: undefined | string,
  actions?: ('removeDownload' | 'goToDetails')[]
}>({ key: 'bookActionDrawerState', default: { openedWith: undefined } })

export const BookActionsDrawer = () => {
  const setOpenManageBookCollectionsDialog = useSetRecoilState(openManageBookCollectionsDialog)
  const [{ openedWith: bookId, actions }, setBookActionDrawerState] = useRecoilState(bookActionDrawerState)
  const history = useHistory()
  const book = useRecoilValue(enrichedBookState(bookId || '-1'))
  const removeDownloadFile = useRemoveDownloadFile()
  const removeBook = useRemoveBook()
  const refreshBookMetadata = useRefreshBookMetadata()
  const [updateBook] = useAtomicUpdateBook()
  const classes = useStyles()
  const opened = !!bookId

  const handleClose = useModalNavitationControl({
    onExit: () => {
      setBookActionDrawerState({ openedWith: undefined })
    }
  }, bookId)


  return (
    <Drawer
      anchor="bottom"
      open={opened}
      onClose={() => handleClose()}
      transitionDuration={0}
    >
      {book && (
        <>
          <div className={classes.topContainer}>
            <div className={classes.coverContainer}>
              <Cover bookId={book._id} />
            </div>
            <div className={classes.topDetails}>
              <Typography variant="body1" noWrap>{book.title}</Typography>
              <Typography variant="caption" noWrap>{book.creator}</Typography>
            </div>
          </div>
          <List>
            {(actions?.includes('goToDetails') || !actions) && (
              <ListItem button
                onClick={() => {
                  handleClose(() => {
                    history.push(ROUTES.BOOK_DETAILS.replace(':id', book._id))
                  })
                }}
              >
                <ListItemText primary="Go to details" />
              </ListItem>
            )}
            {!actions && book.readingStateCurrentState !== ReadingStateState.NotStarted && (
              <ListItem button
                onClick={() => {
                  handleClose()
                  updateBook(book._id, old => ({
                    ...old,
                    readingStateCurrentState: ReadingStateState.NotStarted,
                    readingStateCurrentBookmarkProgressPercent: 0,
                    readingStateCurrentBookmarkProgressUpdatedAt: (new Date()).toISOString(),
                    readingStateCurrentBookmarkLocation: null
                  })).catch(Report.error)
                }}
              >
                <ListItemIcon>
                  <RemoveRounded />
                </ListItemIcon>
                <ListItemText primary="Mark as unread" />
              </ListItem>
            )}
            {!actions && book.readingStateCurrentState !== ReadingStateState.Finished && (
              <ListItem button
                onClick={() => {
                  handleClose()
                  updateBook(book._id, old => ({
                    ...old,
                    readingStateCurrentState: ReadingStateState.Finished,
                    readingStateCurrentBookmarkProgressPercent: 1,
                    readingStateCurrentBookmarkProgressUpdatedAt: (new Date()).toISOString(),
                    readingStateCurrentBookmarkLocation: null
                  })).catch(Report.error)
                }}
              >
                <ListItemIcon>
                  <CheckRounded />
                </ListItemIcon>
                <ListItemText primary="Mark as finished" />
              </ListItem>
            )}
            {!actions && (
              <ListItem button
                onClick={() => {
                  handleClose(() => {
                    setOpenManageBookCollectionsDialog(bookId)
                  })
                }}
              >
                <ListItemIcon>
                  <CollectionsRounded />
                </ListItemIcon>
                <ListItemText primary="Manage collections" />
              </ListItem>
            )}
            {/* {!actions && (
              <ListItem button
                onClick={() => {
                  handleClose()
                }}
              >
                <ListItemText primary="Manage tags" />
              </ListItem>
            )} */}
            {!actions && (
              <ListItem button
                onClick={() => {
                  handleClose()
                  refreshBookMetadata(book._id)
                }}
              >
                <ListItemIcon>
                  <SyncRounded />
                </ListItemIcon>
                <ListItemText primary="Refresh metadata" />
              </ListItem>
            )}
            {(actions?.includes('removeDownload') || !actions) && (book.downloadState === 'downloaded' && !book.isLocal) && (
              <ListItem button
                onClick={() => {
                  handleClose()
                  bookId && removeDownloadFile(bookId)
                }}
              >
                <ListItemIcon>
                  <NoSimRounded />
                </ListItemIcon>
                <ListItemText primary="Remove the book download" />
              </ListItem>
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
                <ListItem button
                  onClick={() => {
                    handleClose()
                    bookId && removeBook({ id: bookId })
                  }}
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
  );
}

const useStyles = makeStyles((theme) => ({
  topContainer: {
    display: 'flex',
    flexDirection: 'row',
    marginLeft: theme.spacing(2),
    marginRight: theme.spacing(2),
    marginTop: theme.spacing(2),
    height: 60,
    [theme.breakpoints.up('sm')]: {
      height: 100,
    },
    [theme.breakpoints.up('md')]: {
      height: 130,
    },
  },
  coverContainer: {
    width: 60 * theme.custom.coverAverageRatio,
    [theme.breakpoints.up('sm')]: {
      width: 100 * theme.custom.coverAverageRatio,
    },
    [theme.breakpoints.up('md')]: {
      width: 130 * theme.custom.coverAverageRatio,
    },
    height: '100%',
    flexShrink: 0,
  },
  topDetails: { display: 'flex', flexDirection: 'column', marginLeft: 10, overflow: 'hidden' }
}))

