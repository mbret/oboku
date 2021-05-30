import { useMemo } from 'react';
import { TopBarNavigation } from '../navigation/TopBarNavigation';
import { Typography, useTheme, Button } from '@material-ui/core';
import { BookList } from '../books/bookList/BookList';
import { ROUTES } from '../constants';
import { useHistory } from 'react-router-dom'
import ContinueReadingAsset from '../assets/continue-reading.svg'
import { useCSS } from '../common/utils';
import { useTranslation } from 'react-i18next'
import { useContinueReadingBooks, useRecentlyAddedBooks } from './helpers';

export const HomeScreen = () => {
  const classes = useStyles();
  const theme = useTheme()
  const history = useHistory()
  const continueReadingBooks = useContinueReadingBooks()
  const recentlyAddedBooks = useRecentlyAddedBooks()
  const adjustedRatioWhichConsiderBottom = theme.custom.coverAverageRatio - 0.1
  const itemWidth = 150
  const { t } = useTranslation()
  const listHeight = Math.floor(itemWidth / adjustedRatioWhichConsiderBottom)
  const listStyle = useMemo(() => ({
    height: listHeight
  }), [listHeight])

  return (
    <div style={classes.container}>
      <TopBarNavigation title={'Home'} showBack={false} hasSearch />
      <div style={classes.innerContainer}>
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
              {t(`button.title.exploreMyLibrary`)}
            </Button>
          </div>
        )}
        {continueReadingBooks.length > 0 && (
          <>
            <div style={classes.title}>
              <Typography variant="h6">Continue reading</Typography>
            </div>
            <BookList
              isHorizontal
              itemWidth={itemWidth}
              data={continueReadingBooks}
              style={listStyle}
              viewMode="grid"
            />
          </>
        )}
        {recentlyAddedBooks.length > 0 && (
          <>
            <div style={classes.title}>
              <Typography variant="h6">Recently added</Typography>
            </div>
            <BookList
              isHorizontal
              itemWidth={itemWidth}
              data={recentlyAddedBooks}
              style={listStyle}
              viewMode="grid"
            />
          </>
        )}
      </div>
    </div>
  );
}

const useStyles = () => {
  const theme = useTheme()

  return useCSS(() => ({
    container: {
      display: 'flex',
      flex: 1,
      overflow: 'hidden',
      flexFlow: 'column',
    },
    innerContainer: {
      height: '100%',
      overflow: 'scroll'
    },
    title: {
      padding: theme.spacing(1),
      paddingTop: theme.spacing(2)
    }
  }), [theme])
}