import React, { useState, FC } from 'react';
import '../App.css';
import { BookList } from './/BookList';
import {
  Dialog, Button, DialogTitle,
  Toolbar, IconButton, makeStyles, createStyles, Badge, ListItemText, ListItem, List, ListItemIcon, Typography, useTheme,
} from '@material-ui/core';
import { AppsRounded, TuneRounded, ListRounded, SortRounded, RadioButtonUnchecked, RadioButtonChecked, LockOpenRounded } from '@material-ui/icons';
import { LibraryFiltersDrawer } from './LibraryFiltersDrawer';
import { useLibraryBooksSettings, useToggleLibraryBooksSettingsViewMode, useUpdateLibraryBooksSettings, LibraryBooksSettings } from './queries';
import { useQueryGetBooks } from '../books/queries';
import * as R from 'ramda';
import { useUser } from '../auth/queries';
import { UploadNewBookDialog } from '../books/UploadNewBookDialog';
import EmptyLibraryAsset from '../assets/empty-library.svg'

export const LibraryBooksScreen = () => {
  const classes = useStyles();
  const theme = useTheme()
  const [isFiltersDrawerOpened, setIsFiltersDrawerOpened] = useState(false)
  const [isSortingDialogOpened, setIsSortingDialogOpened] = useState(false)
  const [isUploadNewBookDialogOpened, setIsUploadNewBookDialogOpened] = useState(false)
  const { data: userData } = useUser()
  const [toggleLibraryBooksSettingsViewMode] = useToggleLibraryBooksSettingsViewMode()
  const { data: libraryBooksSettingsData } = useLibraryBooksSettings()
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

  console.log('[LibraryBooksScreen]', books, libraryBooksSettingsData, userData)

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

  return (
    <div className={classes.container}>
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
            {sorting === 'activity' ? 'Recent activity' : sorting === 'alpha' ? 'Alphabetical - A > Z' : 'Date added'}
          </Button>
          {userData?.user.isLibraryUnlocked && (
            <div style={{ display: 'flex', flexFlow: 'row', alignItems: 'center', marginLeft: theme.spacing(1), overflow: 'hidden' }}>
              <Typography variant="caption" noWrap>Protected content is</Typography>
              &nbsp;<LockOpenRounded fontSize="small" />
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
        overflow: 'scroll',
      }}>
        {visibleBooks.length === 0 && (
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
        {visibleBooks.length > 0 && (
          <BookList
            viewMode={viewMode}
            sorting={sorting}
            headerHeight={60}
            data={visibleBooks}
            style={{ height: '100%' }}
            renderHeader={() => (
              <Toolbar style={{ marginLeft: -theme.spacing(1), marginRight: -theme.spacing(1) }}>
                {addBookButton}
              </Toolbar>
            )}
          />
        )}
        <UploadNewBookDialog open={isUploadNewBookDialogOpened} onClose={() => setIsUploadNewBookDialogOpened(false)} />
        <SortByDialog onClose={() => setIsSortingDialogOpened(false)} open={isSortingDialogOpened} />
        <LibraryFiltersDrawer open={isFiltersDrawerOpened} onClose={() => setIsFiltersDrawerOpened(false)} />
      </div>
    </div >
  );
}

const useSortedList = (sorting: LibraryBooksSettings['sorting'] | undefined) => {
  const { data: booksData } = useQueryGetBooks()
  console.log('useSortedList', booksData)
  const books = booksData || []

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
      overflow: 'hidden'
    },
    title: {
      flexGrow: 1,
    },
  }),
);