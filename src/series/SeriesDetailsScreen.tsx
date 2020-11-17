import React, { useState } from 'react';
import { TopBarNavigation } from '../TopBarNavigation';
import { Button, makeStyles, Toolbar, Typography, useTheme } from '@material-ui/core';
import { useParams } from 'react-router-dom';
import { SeriesBookList } from './SeriesBookList';
import EmptyLibraryAsset from '../assets/empty-library.svg'
import SeriesBgSvg from '../assets/series-bg.svg'
import { BooksSelectionDialog } from './BooksSelectionDialog';
import { useQuery } from '@apollo/client';
import { Query_One_Series_Document } from '../generated/graphql';
import { useMeasureElement } from '../utils';

type ScreenParams = {
  id: string
}

export const SeriesDetailsScreen = () => {
  const classes = useClasses()
  const theme = useTheme()
  const { id } = useParams<ScreenParams>()
  const [isBookDialogOpened, setIsBookDialogOpened] = useState(false)
  const { data } = useQuery(Query_One_Series_Document, { variables: { id }, fetchPolicy: 'cache-only' })
  const series = data?.oneSeries
  const books = data?.oneSeries?.books || []

  const addBookButton = (
    <Button
      style={{
        flex: 1,
      }}
      variant="outlined"
      color="primary"
      onClick={() => setIsBookDialogOpened(true)}
    >
      Add or remove books
    </Button>
  )

  const listHeader = (
    <Toolbar style={{ marginLeft: -theme.spacing(1), marginRight: -theme.spacing(1) }}>
      {addBookButton}
    </Toolbar>
  )

  const [listHeaderDimTracker, { height: listHeaderHeight }] = useMeasureElement(listHeader)

  console.log('[SeriesDetailsScreen]', series)

  return (
    <div style={{
      flex: 1,
      height: '100%',
    }}>
      <TopBarNavigation title="" showBack={true} position="absolute" color="transparent" />
      {listHeaderDimTracker}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        flex: 1,
        // overflow: 'hidden',
      }}>
        <div className={classes.headerContent}>
          <div>
            <Typography variant="h5" gutterBottom className={classes.titleTypo} >
              {series?.name}
            </Typography>
            <Typography variant="subtitle1" gutterBottom className={classes.titleTypo}>
              {`${series?.books?.length || 0} book(s)`}
            </Typography>
          </div>
        </div>
        <div style={{
          display: 'flex',
          height: '100%',
          overflow: 'scroll',
          flex: 1
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
            <SeriesBookList
              seriesId={id}
              headerHeight={listHeaderHeight}
              renderHeader={() => (
                <Toolbar style={{ marginLeft: -theme.spacing(1), marginRight: -theme.spacing(1) }}>
                  {addBookButton}
                </Toolbar>
              )}
            />
          )}
        </div>
      </div>
      {series && <BooksSelectionDialog open={isBookDialogOpened} onClose={() => setIsBookDialogOpened(false)} seriesId={series?.id} />}
    </div>
  );
}

const useClasses = makeStyles(theme => {
  type Props = { headerHeight: string }

  return {
    headerContent: {
      minHeight: 100,
      paddingTop: theme.spacing(1) + 60,
      display: 'flex',
      alignItems: 'flex-end',
      paddingLeft: theme.spacing(2),
      paddingRight: theme.spacing(2),
      width: '100%',
      backgroundImage: `url(${SeriesBgSvg})`,
      backgroundAttachment: 'fixed',
      backgroundSize: 'cover',
    },
    titleTypo: {
      color: 'white',
      textShadow: '0px 0px 3px black'
    }
  }
})