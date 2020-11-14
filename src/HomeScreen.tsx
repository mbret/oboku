import React from 'react';
import { TopBarNavigation } from './TopBarNavigation';
import { makeStyles, createStyles, Typography, useTheme, Button } from '@material-ui/core';
import { useQueryGetBooks } from './books/queries';
import { BookList } from './library/BookList';
import { ROUTES } from './constants';
import * as R from 'ramda';
import { useHistory } from 'react-router-dom'
import ContinueReadingAsset from './assets/continue-reading.svg'

export const HomeScreen = () => {
  const classes = useStyles();
  const theme = useTheme()
  const history = useHistory()
  const continueReadingBooks = useContinueReadingBooks()
  const recentlyAddedBooks = useRecentlyAddedBooks()
  const adjustedRatioWhichConsiderBottom = theme.custom.coverAverageRatio - 0.1
  const itemWidth = 150

  console.log('[HomeScreen]', itemWidth / adjustedRatioWhichConsiderBottom)
  return (
    <div style={{
      // display: 'flex',
      flex: 1,
      overflow: 'scroll',
      flexFlow: 'column',
    }}>
      <TopBarNavigation title={'Home'} showBack={false} />
      {continueReadingBooks.length === 0 && (
        <div style={{
          width: '100%',
          boxSizing: 'border-box',
          padding: theme.spacing(5),
          alignItems: 'center',
          display: 'flex',
          flexFlow: 'column',
        }}>
          <img
            src={ContinueReadingAsset}
            alt="img"
            style={{ width: '100%', maxHeight: 300, objectFit: 'contain', paddingBottom: theme.spacing(3) }}
          />
          <Typography style={{ maxWidth: 300, paddingBottom: theme.spacing(2) }} variant="body1" align="center">Looks like you are not reading anything right now. How about starting today ?</Typography>
          <Button
            variant="outlined"
            color="primary"
            size="large"
            onClick={() => history.replace(ROUTES.LIBRARY_BOOKS)}
          >
            Explore my library
          </Button>
        </div>
      )}
      {continueReadingBooks.length > 0 && (
        <>
          <div className={classes.title}>
            <Typography variant="h6">Continue reading</Typography>
          </div>
          <BookList
            isHorizontal
            itemWidth={itemWidth}
            data={continueReadingBooks}
            style={{
              height: itemWidth / adjustedRatioWhichConsiderBottom,
              // border: '1px solid black'
            }}
            viewMode="list"
          />
        </>
      )}
      {recentlyAddedBooks.length > 0 && (
        <>
          <div className={classes.title}>
            <Typography variant="h6">Recently added</Typography>
          </div>
          <BookList
            isHorizontal
            itemWidth={itemWidth}
            data={recentlyAddedBooks}
            style={{
              height: itemWidth / adjustedRatioWhichConsiderBottom,
              // border: '1px solid black'
            }}
            viewMode="list"
          />
        </>
      )}
    </div>
  );
}

const useContinueReadingBooks = () => {
  const { data: booksData } = useQueryGetBooks()
  const books = booksData || []
  const booksSortedByDate = R.sort(R.descend(R.prop('readingStateCurrentBookmarkProgressUpdatedAt')), books)

  return booksSortedByDate
    .filter(book => (book.readingStateCurrentBookmarkProgressPercent || 0) > 0)
}

const useRecentlyAddedBooks = () => {
  const { data: booksData } = useQueryGetBooks()
  const books = booksData || []
  const booksSortedByDate = R.sort(R.descend(R.prop('createdAt')), books)

  return booksSortedByDate.slice(0, 15)
}

const useStyles = makeStyles((theme) =>
  createStyles({
    title: {
      padding: theme.spacing(1),
      paddingTop: theme.spacing(2)
    }
  }),
);