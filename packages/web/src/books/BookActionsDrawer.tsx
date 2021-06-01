
import React, { useCallback } from 'react';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import { SyncRounded, DeleteForeverRounded, RemoveRounded, CheckRounded, CollectionsRounded, NoSimRounded, LocalOfferRounded } from '@material-ui/icons';
import { useHistory } from 'react-router-dom';
import { useRemoveDownloadFile } from '../download/useRemoveDownloadFile';
import { ROUTES } from '../constants';
import { useAtomicUpdateBook, useRefreshBookMetadata } from './helpers';
import { useRemoveBook } from './helpers';
import { Drawer, Divider, ListItemIcon, Typography, makeStyles } from '@material-ui/core';
import { useManageBookCollectionsDialog } from './ManageBookCollectionsDialog';
import { atom, useRecoilState, useRecoilValue } from 'recoil';
import { enrichedBookState } from './states';
import { Cover } from './Cover';
import { ReadingStateState } from '@oboku/shared';
import { Report } from '../debug/report';
import { useDialogManager } from '../dialog';
import { linkState } from '../links/states';
import { useModalNavigationControl } from '../navigation/helpers';
import { useDataSourcePlugin } from '../dataSources/helpers';
import { useTranslation } from 'react-i18next'
import { useManageBookTagsDialog } from './ManageBookTagsDialog';

export const bookActionDrawerState = atom<{
  openedWith: undefined | string,
  actions?: ('removeDownload' | 'goToDetails')[]
}>({ key: 'bookActionDrawerState', default: { openedWith: undefined } })

export const BookActionsDrawer = () => {
  const {openManageBookCollectionsDialog} = useManageBookCollectionsDialog()
  const { openManageBookTagsDialog } = useManageBookTagsDialog()
  const [{ openedWith: bookId, actions }, setBookActionDrawerState] = useRecoilState(bookActionDrawerState)
  const history = useHistory()
  const book = useRecoilValue(enrichedBookState(bookId || '-1'))
  const bookLink = useRecoilValue(linkState(book?.links[0] || '-1'))
  const removeDownloadFile = useRemoveDownloadFile()
  const removeBook = useRemoveBook()
  const refreshBookMetadata = useRefreshBookMetadata()
  const [updateBook] = useAtomicUpdateBook()
  const classes = useStyles()
  const plugin = useDataSourcePlugin(bookLink?.type)
  const dialog = useDialogManager()
  const opened = !!bookId
  const { t } = useTranslation()

  const handleClose = useModalNavigationControl({
    onExit: () => {
      setBookActionDrawerState({ openedWith: undefined })
    }
  }, bookId)

  const onRemovePress = useCallback(() => {
    handleClose(() => {
      if (book?._id) {
        if (!book?.isAttachedToDataSource || !bookLink) {
          dialog({
            preset: 'CONFIRM',
            title: 'Delete a book',
            content: `You are about to delete a book, are you sure ?`,
            onConfirm: () => {
              removeBook({ id: book._id })
            }
          })
        } else if (book?.isAttachedToDataSource && !bookLink.isRemovableFromDataSource) {
          dialog({
            preset: 'CONFIRM',
            title: 'Delete a book',
            content: `This book has been synchronized with one of your ${plugin?.name} data source. Oboku does not support deletion from ${plugin?.name} directly so consider deleting it there manually if you don't want the book to be synced again`,
            onConfirm: () => {
              removeBook({ id: book._id })
            },
          })
        } else {
          dialog({
            preset: 'CONFIRM',
            title: 'Delete a book',
            content: `This book has been synchronized with one of your ${plugin?.name} data source. You can delete it from both oboku and ${plugin?.name} which will prevent the book to be synced again`,
            actions: [
              {
                type: 'confirm',
                title: 'both',
                onClick: () => {
                  removeBook({ id: book._id, withRemoteDeletion: true })
                }
              },
              {
                type: 'confirm',
                title: 'only oboku',
                onClick: () => {
                  removeBook({ id: book._id })
                }
              }
            ],
          })
        }
      }
    })
  }, [handleClose, book, dialog, removeBook, bookLink, plugin])

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
                    bookId && openManageBookCollectionsDialog(bookId)
                  })
                }}
              >
                <ListItemIcon>
                  <CollectionsRounded />
                </ListItemIcon>
                <ListItemText primary="Manage collections" />
              </ListItem>
            )}
            {!actions && (
              <ListItem button
                onClick={() => {
                  handleClose(() => {
                    bookId && openManageBookTagsDialog(bookId)
                  })
                }}
              >
                <ListItemIcon>
                  <LocalOfferRounded />
                </ListItemIcon>
                <ListItemText primary={t('book.actionDrawer.manageTags')} />
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
            {(!actions && book.canRefreshMetadata) && (
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
                <ListItem button onClick={onRemovePress}  >
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

