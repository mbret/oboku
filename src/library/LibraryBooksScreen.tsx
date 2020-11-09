import React, { useState, FC } from 'react';
import { useReactiveVar } from '@apollo/client';
import '../App.css';
import { BookList } from './/BookList';
import {
  Dialog, Button, DialogActions, DialogContent, DialogTitle, TextField,
  Toolbar, IconButton, makeStyles, createStyles, Badge, ListItemText, ListItem, List, ListItemIcon,
} from '@material-ui/core';
import { AppsRounded, TuneRounded, ListRounded, SortRounded, RadioButtonUnchecked, RadioButtonChecked } from '@material-ui/icons';
import { models } from '../client';
import { BookActionsDrawer } from '../books/BookActionsDrawer';
import { LibraryFiltersDrawer } from './LibraryFiltersDrawer';
import { useLibraryBooksSettings, useToggleLibraryBooksSettingsViewMode, useUpdateLibraryBooksSettings, LibraryBooksSettings } from './queries';
import { useAddBook, useQueryGetBooks } from '../books/queries';
import * as R from 'ramda';

export const LibraryBooksScreen = () => {
  const classes = useStyles();
  const [isFiltersDrawerOpened, setIsFiltersDrawerOpened] = useState(false)
  const [isSortingDialogOpened, setIsSortingDialogOpened] = useState(false)
  const isBookActionDialogOpenedWithVar = useReactiveVar(models.isBookActionDialogOpenedWithVar)
  const [toggleLibraryBooksSettingsViewMode] = useToggleLibraryBooksSettingsViewMode()
  const { data: libraryBooksSettingsData } = useLibraryBooksSettings()
  const addBook = useAddBook()
  const [closed, setClosed] = useState(true)
  const [bookUrl, setBookUrl] = useState('')
  const libraryFilters = libraryBooksSettingsData?.libraryBooksSettings
  const sorting = libraryFilters?.sorting
  const books = useSortedList(sorting)
  const viewMode = libraryBooksSettingsData?.libraryBooksSettings.viewMode
  const tagsFilterApplied = (libraryFilters?.tags.length || 0) > 0
  const numberOfFiltersApplied = [tagsFilterApplied].filter(i => i).length
  const filteredTags = libraryFilters?.tags?.map(tag => tag?.id || '-1') || []
  const visibleBooks = filteredTags.length === 0
    ? books
    : books
      .filter(book => book.tags?.some(b => filteredTags.includes(b.id || '-1')))

  const handleClose = () => {
    setClosed(true)
  };

  const handleConfirm = () => {
    setBookUrl('')
    addBook(bookUrl)
    handleClose()
  }

  const onClickAddBook = () => {
    setClosed(false)
  }

  console.log('[LibraryBooksScreen]', books, libraryBooksSettingsData)

  return (
    <div className={classes.container}>
      <Toolbar>
        <IconButton
          edge="start"
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
        <div style={{ flexGrow: 1, justifyContent: 'flex-start' }}>
          <Button
            onClick={() => setIsSortingDialogOpened(true)}
            startIcon={<SortRounded />}
          >
            {sorting === 'activity' ? 'Recent activity' : sorting === 'alpha' ? 'Alphabetical - A > Z' : 'Date added'}
          </Button>
        </div>
        <IconButton
          onClick={() => {
            toggleLibraryBooksSettingsViewMode()
          }}
        >
          {viewMode === 'grid' ? <AppsRounded /> : <ListRounded />}
        </IconButton>
      </Toolbar>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        flex: 1,
        // flexGrow: 1
      }}>
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
        <BookList
          viewMode={viewMode}
          sorting={sorting}
          headerHeight={60}
          data={visibleBooks}
          style={{ height: '100%' }}
          renderHeader={() => (
            <Toolbar>
              <Button
                style={{
                  width: '100%'
                }}
                variant="outlined"
                disableFocusRipple
                disableRipple
                onClick={onClickAddBook}
              >
                Create a new book
              </Button>
            </Toolbar>
          )}
        />
        <SortByDialog onClose={() => setIsSortingDialogOpened(false)} open={isSortingDialogOpened} />
        <LibraryFiltersDrawer open={isFiltersDrawerOpened} onClose={() => setIsFiltersDrawerOpened(false)} />
      </div>
    </div>
  );
}

const useSortedList = (sorting: LibraryBooksSettings['sorting'] | undefined) => {
  const { data: booksData } = useQueryGetBooks()
  console.log('useSortedList', booksData)
  const books = booksData?.books?.books || []

  switch (sorting) {
    case 'date': {
      return R.sort(R.descend(R.prop('createdAt')), books)
    }
    case 'activity': {
      return R.sort(R.descend(R.prop('readingStateCurrentBookmarkProgressUpdatedAt')), books)
    }
    default: {
      return R.sort(R.ascend(R.prop('title')), books)
    }
  }
}

const SortByDialog: FC<{ onClose: () => void, open: boolean }> = ({ onClose, open }) => {
  const { data } = useLibraryBooksSettings()
  const [updateLibraryBooksSettings] = useUpdateLibraryBooksSettings()
  const sorting = data?.libraryBooksSettings?.sorting || 'date'

  const onSortChange = (newSorting: typeof sorting) => {
    onClose()
    updateLibraryBooksSettings({ sorting: newSorting })
  }

  return (
    <Dialog
      onClose={onClose}
      open={open}
    >
      <DialogTitle>Sort by</DialogTitle>
      <List>
        <ListItem button
          onClick={() => onSortChange('alpha')}
        >
          <ListItemIcon >
            {sorting === 'alpha' ? <RadioButtonChecked /> : <RadioButtonUnchecked />}
          </ListItemIcon>
          <ListItemText primary="Alphabetical - A > Z" />
        </ListItem>
        <ListItem button
          onClick={() => onSortChange('date')}
        >
          <ListItemIcon >
            {sorting === 'date' ? <RadioButtonChecked /> : <RadioButtonUnchecked />}
          </ListItemIcon>
          <ListItemText primary="Date added" />
        </ListItem>
        <ListItem button
          onClick={() => onSortChange('activity')}
        >
          <ListItemIcon >
            {sorting === 'activity' ? <RadioButtonChecked /> : <RadioButtonUnchecked />}
          </ListItemIcon>
          <ListItemText primary="Recent activity" />
        </ListItem>
      </List>
    </Dialog>
  )
}

const useStyles = makeStyles((theme) =>
  createStyles({
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      flex: 1,
    },
    title: {
      flexGrow: 1,
    },
  }),
);