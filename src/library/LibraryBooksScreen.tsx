import React, { useState } from 'react';
import { gql, useMutation, useQuery, useReactiveVar } from '@apollo/client';
import '../App.css';
import Dialog from '@material-ui/core/Dialog';
import { BookList } from './/BookList';
import { Button, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField, AppBar, Toolbar, IconButton, Typography, makeStyles, createStyles, Drawer, Badge } from '@material-ui/core';
import { Menu, PublishRounded, TuneRounded } from '@material-ui/icons';
import { useLazyQueryGetTags, useQueryGetLibraryFilters } from '../queries';
import { models } from '../client';
import { BookActionDialog } from '../BookActionsDialog';
import { LibraryFiltersDrawer } from './LibraryFiltersDrawer';
import { GET_BOOKS } from '../books/queries';

const ADD_BOOK = gql`
  mutation AddBook($url: String!) {
    addBook(url: $url) {
      url
    }
  }
`;

export const LibraryBooksScreen = () => {
  const classes = useStyles();
  const [isFiltersDrawerOpened, setIsFiltersDrawerOpened] = useState(false)
  const isBookActionDialogOpenedWithVar = useReactiveVar(models.isBookActionDialogOpenedWithVar)
  const { data: libraryFiltersData } = useQueryGetLibraryFilters()
  const [addBook, { loading, error, data, client, called }] = useMutation(ADD_BOOK, {
    refetchQueries: ['Books'],
  });
  const { refetch } = useQuery(GET_BOOKS, {
    // pollInterval: 1000,
  });
  const [getTags, { refetch: refetchGetTags }] = useLazyQueryGetTags()
  const [closed, setClosed] = useState(true)
  const [bookUrl, setBookUrl] = useState('')
  const libraryFilters = libraryFiltersData?.libraryFilters
  const tagsFilterApplied = (libraryFilters?.tags.length || 0) > 0
  const numberOfFiltersApplied = [tagsFilterApplied].filter(i => i).length

  const handleClose = () => {
    setClosed(true)
  };

  const handleConfirm = () => {
    addBook({ variables: { url: bookUrl } }).catch(() => { });
    handleClose()
  }

  const onClickAddBook = () => {
    setClosed(false)
  }

  console.log('LibraryBooksScreen', isBookActionDialogOpenedWithVar, refetchGetTags)

  return (
    <div className={classes.container}>
      <Toolbar>
        <IconButton
          edge="start"
          className={classes.menuButton}
          color="inherit"
          aria-label="menu"
          onClick={() => setIsFiltersDrawerOpened(true)}
        >
          {numberOfFiltersApplied > 0
            ? (
              <Badge badgeContent={numberOfFiltersApplied} color="primary">
                <TuneRounded />
              </Badge>
            )
            : (
              <TuneRounded />
            )}
        </IconButton>
        <Button
          color="inherit"
          onClick={onClickAddBook}
          startIcon={<PublishRounded />}
        >
          Add a new book
          </Button>
      </Toolbar>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        flex: 1,
        // flexGrow: 1
      }}>
        <div style={{}}>
          <button
            onClick={() => {
              refetch()
              refetchGetTags ? refetchGetTags() : getTags()
            }}
          >Sync library</button>
        </div>
        <Dialog onClose={handleClose} open={!closed}>
          <DialogTitle>Add a book</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              id="name"
              label="book url"
              type="text"
              fullWidth
              value={bookUrl}
              onChange={e => setBookUrl(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose} color="primary">
              Cancel
            </Button>
            <Button onClick={handleConfirm} color="primary">
              Add
            </Button>
          </DialogActions>
        </Dialog>
        <BookActionDialog />
        <BookList />
        <LibraryFiltersDrawer open={isFiltersDrawerOpened} onClose={() => setIsFiltersDrawerOpened(false)} />
      </div>
    </div>
  );
}

const useStyles = makeStyles((theme) =>
  createStyles({
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      flex: 1,
    },
    menuButton: {
      marginRight: theme.spacing(2),
    },
    title: {
      flexGrow: 1,
    },
  }),
);