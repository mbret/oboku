import React, { useState, FC, useMemo } from 'react';
import { BookList } from '../books/bookList/BookList';
import {
  Dialog, Button, DialogTitle,
  Toolbar, IconButton, makeStyles, createStyles, Badge, ListItemText, ListItem, List, ListItemIcon, Typography, useTheme,
} from '@material-ui/core';
import { AppsRounded, TuneRounded, ListRounded, SortRounded, RadioButtonUnchecked, RadioButtonChecked, LockOpenRounded } from '@material-ui/icons';
import { LibraryFiltersDrawer } from './LibraryFiltersDrawer';
import * as R from 'ramda';
import { UploadNewBookDialog } from '../books/UploadNewBookDialog';
import EmptyLibraryAsset from '../assets/empty-library.svg'
import { useMeasureElement } from '../utils';
import { LibraryViewMode } from '../rxdb';
import { LibraryDocType, libraryState } from './states';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { booksAsArrayState } from '../books/states';

export const LibraryBooksScreen = () => {
  const classes = useStyles();
  const theme = useTheme()
  const [isFiltersDrawerOpened, setIsFiltersDrawerOpened] = useState(false)
  const [isSortingDialogOpened, setIsSortingDialogOpened] = useState(false)
  const [isUploadNewBookDialogOpened, setIsUploadNewBookDialogOpened] = useState(false)
  const setLibraryState = useSetRecoilState(libraryState)
  const library = useRecoilValue(libraryState)
  const sortedList = useSortedList(library.sorting)
  const tagsFilterApplied = (library?.tags.length || 0) > 0
  const numberOfFiltersApplied = [tagsFilterApplied].filter(i => i).length
  const filteredTags = library.tags
  const visibleBooks = sortedList
      .filter(book => {
        let valid = true
        if (filteredTags.length > 0 && !book?.tags?.some(b => filteredTags.includes(b))) {
          valid = false
        }
        if (library.readingStates.length > 0 && !library.readingStates.includes(book.readingStateCurrentState)) {
          valid = false
        }
        return valid
      })
  const books = useMemo(() => visibleBooks.map(item => item._id), [visibleBooks])

  const addBookButton = (
    <Button
      style={{
        flex: 1,
      }}
      variant="outlined"
      color="primary"
      onClick={() => setIsUploadNewBookDialogOpened(true)}
    >
      Add a new book
    </Button>
  )

  const listHeader = (
    < Toolbar style={{ marginLeft: -theme.spacing(1), marginRight: -theme.spacing(1) }}>
      {addBookButton}
    </Toolbar>
  )

  const [listHeaderDimTracker, { height: listHeaderHeight }] = useMeasureElement(listHeader)

  console.log('[LibraryBooksScreen]', books)

  return (
    <div className={classes.container}>
      {listHeaderDimTracker}
      <Toolbar style={{ borderBottom: `1px solid ${theme.palette.grey[200]}`, boxSizing: 'border-box' }}>
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
            variant="text"
            color="secondary"
            onClick={() => setIsSortingDialogOpened(true)}
            startIcon={<SortRounded />}
          >
            {library.sorting === 'activity' ? 'Recent activity' : library.sorting === 'alpha' ? 'A > Z' : 'Date added'}
          </Button>
        </div>
        {library?.isLibraryUnlocked && (
          <div style={{ display: 'flex', flexFlow: 'row', alignItems: 'center', marginLeft: theme.spacing(1), overflow: 'hidden' }}>
            <LockOpenRounded fontSize="small" />
          </div>
        )}
        <IconButton
          onClick={() => {
            setLibraryState(prev => ({ ...prev, viewMode: library?.viewMode === LibraryViewMode.GRID ? LibraryViewMode.LIST : LibraryViewMode.GRID }))
          }}
        >
          {library?.viewMode === 'grid' ? <AppsRounded /> : <ListRounded />}
        </IconButton>
      </Toolbar>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        flex: 1,
        overflow: 'scroll',
      }}>
        {books.length === 0 && (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            flex: 1,
          }}>
            <Toolbar style={{ width: '100%', boxSizing: 'border-box' }}>
              {addBookButton}
            </Toolbar>
            <div style={{
              display: 'flex',
              flex: 1,
              justifyContent: 'center',
              flexFlow: 'column',
              alignItems: 'center',
              textAlign: 'center',
              // paddingLeft: theme.spacing(2),
              // paddingRight: theme.spacing(2),
              width: '80%',
              maxWidth: theme.custom.maxWidthCenteredContent
            }}>
              <img
                style={{
                  width: '100%',
                  // maxWidth: theme.,
                }}
                src={EmptyLibraryAsset}
                alt="libray"
              />
              <Typography style={{ maxWidth: 300, paddingTop: theme.spacing(1) }}>It looks like your library is empty for the moment. Maybe it's time to add a new book</Typography>
            </div>
          </div>
        )}
        {books.length > 0 && (
          <BookList
            viewMode={library?.viewMode}
            sorting={library.sorting}
            headerHeight={listHeaderHeight}
            data={books}
            style={{ height: '100%' }}
            renderHeader={() => listHeader}
          />
        )}
        <UploadNewBookDialog open={isUploadNewBookDialogOpened} onClose={() => setIsUploadNewBookDialogOpened(false)} />
        <SortByDialog onClose={() => setIsSortingDialogOpened(false)} open={isSortingDialogOpened} />
        <LibraryFiltersDrawer open={isFiltersDrawerOpened} onClose={() => setIsFiltersDrawerOpened(false)} />
      </div>
    </div >
  );
}

const useSortedList = (sorting: LibraryDocType['sorting'] | undefined) => {
  const books = useRecoilValue(booksAsArrayState)

  switch (sorting) {
    case 'date': {
      return R.sort(R.ascend(R.prop('createdAt')), books)
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
  const library = useRecoilValue(libraryState)
  const setLibraryState = useSetRecoilState(libraryState)
  const sorting = library.sorting || 'date'

  const onSortChange = (newSorting: typeof sorting) => {
    onClose()
    setLibraryState(prev => ({ ...prev, sorting: newSorting }))
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
      overflow: 'hidden'
    },
    title: {
      flexGrow: 1,
    },
  }),
);