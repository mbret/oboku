import React, { useState, FC } from 'react';
import '../App.css';
import { BookList } from './/BookList';
import {
  Dialog, Button, DialogActions, DialogContent, DialogTitle, TextField,
  Toolbar, IconButton, makeStyles, createStyles, Badge, ListItemText, ListItem, List, ListItemIcon, Typography, useTheme,
} from '@material-ui/core';
import { AppsRounded, TuneRounded, ListRounded, SortRounded, RadioButtonUnchecked, RadioButtonChecked, LockOpenRounded } from '@material-ui/icons';
import { LibraryFiltersDrawer } from './LibraryFiltersDrawer';
import { useLibraryBooksSettings, useToggleLibraryBooksSettingsViewMode, useUpdateLibraryBooksSettings, LibraryBooksSettings } from './queries';
import { useAddBook, useQueryGetBooks } from '../books/queries';
import * as R from 'ramda';
import { useUser } from '../auth/queries';

export const LibraryBooksScreen = () => {
  const classes = useStyles();
  const theme = useTheme()
  const [isFiltersDrawerOpened, setIsFiltersDrawerOpened] = useState(false)
  const [isSortingDialogOpened, setIsSortingDialogOpened] = useState(false)
  const { data: userData } = useUser()
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

  console.log('[LibraryBooksScreen]', books, libraryBooksSettingsData, userData)

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
        <div style={{ flexGrow: 1, justifyContent: 'flex-start', flexFlow: 'row', display: 'flex', alignItems: 'center' }}>
          <Button
            onClick={() => setIsSortingDialogOpened(true)}
            startIcon={<SortRounded />}
          >
            {sorting === 'activity' ? 'Recent activity' : sorting === 'alpha' ? 'Alphabetical - A > Z' : 'Date added'}
          </Button>
          {userData?.user.isLibraryUnlocked && (
            <div style={{ display: 'flex', flexFlow: 'row', alignItems: 'center', marginLeft: theme.spacing(1), overflow: 'hidden' }}>
              <Typography variant="caption" noWrap>Protected content is</Typography>
              &nbsp;<LockOpenRounded fontSize="small"/>
            </div>
          )}
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
                  flex: 1,
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
  const books = booksData || []

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