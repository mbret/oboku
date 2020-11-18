
import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Avatar from '@material-ui/core/Avatar';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import ListItemText from '@material-ui/core/ListItemText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Dialog from '@material-ui/core/Dialog';
import { Remove, CloudDownload, Book, SyncRounded, DeleteForeverRounded, EditRounded, ListAltRounded, LibraryBooksRounded } from '@material-ui/icons';
import AddIcon from '@material-ui/icons/Add';
import Typography from '@material-ui/core/Typography';
import { blue } from '@material-ui/core/colors';
import { useReactiveVar, useMutation, useQuery, useLazyQuery } from '@apollo/client';
import { models } from '../client';
import localforage from 'localforage';
import { useHistory } from 'react-router-dom';
import { useRemoveDownloadFile } from '../download/useRemoveDownloadFile';
import { ROUTES } from '../constants';
import { useRemoveBook, useEditBook } from './queries';
import { Drawer, Divider, ListItemIcon } from '@material-ui/core';
import { openManageBookCollectionsDialog } from './ManageBookCollectionsDialog';
import { QueryBookDocument } from '../generated/graphql';

export const BookActionsDrawer = (props) => {
  const bookId = useReactiveVar(models.isBookActionDialogOpenedWithVar)
  const history = useHistory()
  const [getBook, { data }] = useLazyQuery(QueryBookDocument)
  const removeDownloadFile = useRemoveDownloadFile()
  const removeBook = useRemoveBook()
  const editBook = useEditBook()
  const classes = useStyles();
  const book = data?.book

  const handleClose = () => {
    models.isBookActionDialogOpenedWithVar(undefined)
  };

  useEffect(() => {
    bookId && getBook({
      variables: { id: bookId }
    })
  }, [bookId, getBook])

  return (
    <Drawer
      anchor="bottom"
      open={!!bookId}
      onClose={handleClose}
      transitionDuration={0}
    >
      {book && (
        <>
          <List>
            <ListItem button
              onClick={() => {
                handleClose()
                history.push(ROUTES.BOOK_DETAILS.replace(':id', book.id))
              }}
            >
              <ListItemIcon>
                <ListAltRounded />
              </ListItemIcon>
              <ListItemText primary="Go to details" />
            </ListItem>
            <ListItem button
              onClick={() => {
                handleClose()
                editBook({ id: book.id, lastMetadataUpdatedAt: null })
              }}
            >
              <ListItemIcon>
                <SyncRounded />
              </ListItemIcon>
              <ListItemText primary="Refresh metadata" />
            </ListItem>
            <ListItem button
              onClick={() => {
                handleClose()
                openManageBookCollectionsDialog(bookId)
              }}
            >
              <ListItemIcon>
                <LibraryBooksRounded />
              </ListItemIcon>
              <ListItemText primary="Add or remove from collection" />
            </ListItem>
            {book.downloadState === 'downloaded' && (
              <ListItem button
                onClick={() => {
                  handleClose()
                  bookId && removeDownloadFile(bookId)
                }}
              >
                <ListItemIcon>
                  <DeleteForeverRounded />
                </ListItemIcon>
                <ListItemText primary="Remove the book download" />
              </ListItem>
            )}
          </List>
          <Divider />
          <List>
            <ListItem button
              onClick={() => {
                handleClose()
                bookId && removeBook(bookId)
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
    </Drawer>
  );
}

const useStyles = makeStyles({
  avatar: {
    backgroundColor: blue[100],
    color: blue[600],
  },
});