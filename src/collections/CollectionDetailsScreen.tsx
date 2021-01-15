import React, { useState } from 'react'
import { TopBarNavigation } from '../TopBarNavigation'
import { Button, makeStyles, Toolbar, Typography, useTheme } from '@material-ui/core'
import { useParams } from 'react-router-dom'
import { CollectionBookList } from './CollectionBookList'
import EmptyLibraryAsset from '../assets/empty-library.svg'
import CollectionBgSvg from '../assets/series-bg.svg'
import { BooksSelectionDialog } from './BooksSelectionDialog'
import { useMeasureElement } from '../utils'
import { useRecoilValue } from 'recoil'
import { collectionState } from './states'

type ScreenParams = {
  id: string
}

export const CollectionDetailsScreen = () => {
  const classes = useClasses()
  const theme = useTheme()
  const { id } = useParams<ScreenParams>()
  const [isBookDialogOpened, setIsBookDialogOpened] = useState(false)
  const collection = useRecoilValue(collectionState(id || '-1'))
  const books = collection?.books || []

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

  console.log('[CollectionDetailsScreen]', collection)

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
              {collection?.name}
            </Typography>
            <Typography variant="subtitle1" gutterBottom className={classes.titleTypo}>
              {`${collection?.books?.length || 0} book(s)`}
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
            <CollectionBookList
              collectionId={id}
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
      {collection && <BooksSelectionDialog open={isBookDialogOpened} onClose={() => setIsBookDialogOpened(false)} collectionId={collection?._id} />}
    </div>
  )
}

const useClasses = makeStyles(theme => {
  return {
    headerContent: {
      minHeight: 100,
      paddingTop: theme.spacing(1) + 60,
      display: 'flex',
      alignItems: 'flex-end',
      paddingLeft: theme.spacing(2),
      paddingRight: theme.spacing(2),
      width: '100%',
      backgroundImage: `url(${CollectionBgSvg})`,
      backgroundAttachment: 'fixed',
      backgroundSize: 'cover',
    },
    titleTypo: {
      color: 'white',
      textShadow: '0px 0px 3px black'
    }
  }
})