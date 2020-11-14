import React, { useState } from 'react';
import { TopBarNavigation } from '../TopBarNavigation';
import { Button, makeStyles, Toolbar, Typography, useTheme } from '@material-ui/core';
import { useParams } from 'react-router-dom';
import { SeriesBookList } from './SeriesBookList';
import EmptyLibraryAsset from '../assets/empty-library.svg'
import TopCoverAsset from '../assets/books-1614215_1920.jpg'
import { BooksSelectionDialog } from './BooksSelectionDialog';
import { useQuery } from '@apollo/client';
import { Query_One_Series_Document } from '../generated/graphql';

type ScreenParams = {
  id: string
}

export const SeriesDetailsScreen = () => {
  const headerHeight = '20vh'
  const classes = useClasses({ headerHeight })
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

  console.log('[SeriesDetailsScreen]', series)

  return (
    <div style={{
      flex: 1,
    }}>
      <TopBarNavigation title="" showBack={true} position="absolute" color="transparent" />
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        flex: 1,
        overflow: 'scroll',
      }}>
        <img
          src="/series-bg.webp"
          // src={TopCoverAsset}
          alt="img"
          style={{
            width: '100%',
            // filter: 'grayscale(100%)',
            height: headerHeight,
            objectFit: 'cover',
          }}
        />
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
        {books.length > 0 && <SeriesBookList seriesId={id} />}
      </div>
      {series && <BooksSelectionDialog open={isBookDialogOpened} onClose={() => setIsBookDialogOpened(false)} seriesId={series?.id} />}
    </div>
  );
}

const useClasses = makeStyles(theme => {
  type Props = { headerHeight: string }

  return {
    headerContent: {
      boxShadow: 'black 0px 82px 50px -50px inset',
      height: ({ headerHeight }: Props) => headerHeight,
      position: 'absolute',
      top: 0,
      display: 'flex',
      alignItems: 'flex-end',
      paddingLeft: theme.spacing(2),
      paddingRight: theme.spacing(2),
    },
    titleTypo: {
      color: 'white',
      textShadow: '0px 0px 3px black'
    }
  }
})