import React, { useRef, useMemo, useCallback, Component } from 'react'
import { CircularProgress, GridList, GridListTile, GridListTileBar, IconButton, makeStyles, Typography } from "@material-ui/core"
import { Info, CloudDownloadRounded, MoreVert } from '@material-ui/icons';
import { useQueryGetLibraryFilters } from '../queries';
import { models, Book } from '../client';
import { useWindowSize, useScrollbarWidth } from 'react-use';
import { API_URI, COVER_AVERAGE_RATIO } from '../constants';
import { useDownloadFile } from '../download/useDownloadFile';
import { useHistory } from 'react-router-dom';
import { useQueryGetBooks } from '../books/queries';
import { ItemList } from '../lists/ItemList';

export const BookList = () => {
  const history = useHistory();
  const sbw = useScrollbarWidth() || 0;
  const classes = useStyles();
  const windowSize = useWindowSize()
  const { data: booksData, error } = useQueryGetBooks()
  const downloadFile = useDownloadFile()
  const { data: libraryFiltersData } = useQueryGetLibraryFilters()
  const books = booksData?.books || []
  const filteredTags = libraryFiltersData?.libraryFilters?.tags?.map(tag => tag?.id || '-1') || []
  const visibleBooks = filteredTags.length === 0
    ? books
    : books
      .filter(book => book.tags?.some(b => filteredTags.includes(b.id || '-1')))

  const rowRenderer = useCallback((type, book: Book) => {
    return (
      <div
        key={book.id}
        className={classes.itemContainer}
        onClick={() => {
          if (!book.lastMetadataUpdatedAt) return
          if (book.downloadState === 'none') {
            book.id && downloadFile(book.id).catch(() => { })
          } else if (book.downloadState === 'downloaded') {
            history.push(`/reader/${book.id}`)
          }
        }}
      >
        <img
          alt="img"
          src={`${API_URI}/cover/${book.id}`}
          style={{
            position: 'relative',
            // border: '1px solid black',
            ...!(book.downloadState === 'downloaded') && {
              opacity: 0.5,
            },
            flexGrow: 1,
            width: '100%',
            objectFit: 'cover',
            borderRadius: 10,
          }}
        />
        <div
          className={classes.itemBottomContainer}
          onClick={(e) => {
            e.stopPropagation()
            book.id && models.isBookActionDialogOpenedWithVar(models.isBookActionDialogOpenedWithVar(book.id))
          }}
        >
          <div style={{ width: '100%' }}>
            <Typography variant="subtitle1">{book?.title}</Typography>
            <Typography variant="subtitle2">{book?.author || 'Unknown'}</Typography>
          </div>
          <MoreVert style={{ transform: 'translate(50%, 0%)' }} />
        </div>
      </div >
    )
  }, [classes])

  console.log('[BookList]', libraryFiltersData, booksData, sbw)

  // return (
  //   <ItemList
  //     data={visibleBooks}
  //     rowRenderer={rowRenderer}
  //     numberOfItems={1}
  //     preferredRatio={coverRatioAdjustmentDueToBottomArea}
  //   // className={classes.container}
  //   />
  // )

  return (
    <div className={classes.container}>
      <ItemList
        data={visibleBooks}
        rowRenderer={rowRenderer}
        numberOfItems={2}
        preferredRatio={COVER_AVERAGE_RATIO}
      // className={classes.container}
      />
    </div>
  )

  // return (
  //   <div
  //     className={classes.container}>
  //     {visibleBooks && (
  //       <GridList cellHeight={300} className={classes.gridList} cols={3}>
  //         {visibleBooks
  //           .map((book: any) => (
  //             <GridListTile
  //               key={book.id}
  //               style={{
  //                 cursor: 'pointer'
  //               }}
  //               onClick={() => {
  //                 if (!book.lastMetadataUpdatedAt) return
  //                 if (book.downloadState === 'none') {
  //                   downloadFile(book.id).catch(() => { })
  //                 } else if (book.downloadState === 'downloaded') {
  //                   history.push(`/reader/${book.id}`)
  //                 }
  //               }}
  //             >
  //               <img
  //                 alt="img"
  //                 src={`${API_URI}/cover/${book.id}`}
  //                 // onError={}
  //                 style={{
  //                   ...!(book.downloadState === 'downloaded') && {
  //                     opacity: 0.5,
  //                   },
  //                 }} />
  //               <div style={{
  //                 position: 'absolute',
  //                 height: '100%',
  //                 width: '100%',
  //                 top: 0,
  //                 display: 'flex',
  //                 justifyContent: 'center',
  //                 alignItems: 'center'
  //               }}>
  //                 {!book.lastMetadataUpdatedAt && (
  //                   <CircularProgress />
  //                 )}
  //               </div>
  //               {book.lastMetadataUpdatedAt && book.downloadState !== 'downloaded' && <GridListTileBar
  //                 title={book.downloadState === 'downloading' ? 'Downloading...' : <CloudDownloadRounded />}
  //                 titlePosition="top"
  //                 actionPosition="left"
  //               />}
  //               <GridListTileBar
  //                 title={book.lastMetadataUpdatedAt ? book.title : ''}
  //                 subtitle={
  //                   <span>{book.lastMetadataUpdatedAt ? `by: ${book.author}` : 'Fetching metadata...'}</span>
  //                 }
  //                 actionIcon={
  //                   <IconButton
  //                     aria-label={`info about ${book.title}`}
  //                     className={classes.icon}
  //                     onClick={(e) => {
  //                       e.stopPropagation()
  //                       models.isBookActionDialogOpenedWithVar(models.isBookActionDialogOpenedWithVar(book.id))
  //                     }}
  //                   >
  //                     <Info />
  //                   </IconButton>
  //                 }
  //               />
  //             </GridListTile>
  //           ))}
  //       </GridList>
  //     )}

  //   </div>
  // )
}

const useStyles = () => {
  const windowSize = useWindowSize()

  return useRef(makeStyles((theme) => ({
    container: {
      paddingLeft: theme.spacing(1),
      paddingRight: theme.spacing(1),
      display: 'flex',
      flexFlow: 'column',
      height: '100%',
    },
    itemContainer: {
      cursor: 'pointer',
      border: '1px solid blue',
      height: '100%',
      position: 'relative',
      paddingBottom: 10,
      boxSizing: 'border-box',
      display: 'flex',
      flexFlow: 'column',
      padding: theme.spacing(1)
    },
    itemBottomContainer: {
      backgroundColor: 'green',
      boxSizing: 'border-box',
      width: '100%',
      height: 50,
      flexFlow: 'row',
      display: 'flex',
      alignItems: 'center',
      paddingLeft: 2,
      paddingRight: 5,
    },
    gridList: {
      width: (props: any) => props.windowSize.width,
    },
  }))).current({
    windowSize
  })
}