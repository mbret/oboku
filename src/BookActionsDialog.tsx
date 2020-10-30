
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
import { Remove, CloudDownload, Book, SyncRounded, DeleteForeverRounded, EditRounded, ListAltRounded } from '@material-ui/icons';
import AddIcon from '@material-ui/icons/Add';
import Typography from '@material-ui/core/Typography';
import { blue } from '@material-ui/core/colors';
import { useReactiveVar, useMutation, useQuery, useLazyQuery } from '@apollo/client';
import { models } from './client';
import localforage from 'localforage';
import { useHistory } from 'react-router-dom';
import { useRemoveDownloadFile } from './download/useRemoveDownloadFile';
import { ROUTES } from './constants';
import { REFRESH_BOOK_METADATA, GET_BOOK, REMOVE_BOOK } from './books/queries';

export const BookActionDialog = (props) => {
  const bookId = useReactiveVar(models.isBookActionDialogOpenedWithVar)
  const history = useHistory()
  const [getBook, { data }] = useLazyQuery(GET_BOOK)
  const removeDownloadFile = useRemoveDownloadFile()
  const [removeBook] = useMutation(REMOVE_BOOK, {
    refetchQueries: ['Books'],
  })
  const [refreshBookMetadata] = useMutation(REFRESH_BOOK_METADATA)
  const classes = useStyles();
  const book = data?.book

  console.log(data)

  const handleClose = () => {
    models.isBookActionDialogOpenedWithVar(undefined)
  };

  useEffect(() => {
    bookId && getBook({
      variables: { id: bookId }
    })
  }, [bookId, getBook])

  return (
    <Dialog
      onClose={handleClose}
      aria-labelledby="simple-dialog-title"
      open={!!bookId}
    >
      <DialogTitle id="simple-dialog-title">Book actions</DialogTitle>
      {book && (
        <List>
          <ListItem button
            onClick={() => {
              handleClose()
              history.push(ROUTES.BOOK_DETAILS.replace(':id', book?.id))
            }}
          >
            <ListItemAvatar>
              <Avatar>
                <ListAltRounded />
              </Avatar>
            </ListItemAvatar>
            <ListItemText primary="Go to details" />
          </ListItem>
          <ListItem button
            onClick={() => {
              handleClose()
              refreshBookMetadata({ variables: { id: bookId } }).catch(() => { })
            }}
          >
            <ListItemAvatar>
              <Avatar>
                <SyncRounded />
              </Avatar>
            </ListItemAvatar>
            <ListItemText primary="Refresh metadata" />
          </ListItem>
          {book.downloadState === 'downloaded' && (
            <ListItem button
              onClick={() => {
                handleClose()
                bookId && removeDownloadFile(bookId)
              }}
            >
              <ListItemAvatar>
                <Avatar>
                  <DeleteForeverRounded />
                </Avatar>
              </ListItemAvatar>
              <ListItemText primary="Remove the book download" />
            </ListItem>
          )}
          <ListItem button
            onClick={() => {
              handleClose()
              removeBook({ variables: { id: bookId } }).catch(() => { })
            }}
          >
            <ListItemAvatar>
              <Avatar>
                <Remove />
              </Avatar>
            </ListItemAvatar>
            <ListItemText primary="Remove the book from library" />
          </ListItem>
        </List>
      )}
    </Dialog>
  );
}

const useStyles = makeStyles({
  avatar: {
    backgroundColor: blue[100],
    color: blue[600],
  },
});