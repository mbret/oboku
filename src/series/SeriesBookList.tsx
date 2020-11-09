import React, { useRef, FC } from 'react'
import { CircularProgress, GridList, GridListTile, GridListTileBar, IconButton, makeStyles } from "@material-ui/core"
import { Info, CloudDownloadRounded } from '@material-ui/icons';
import { useQueryGetOneSeries } from '../series/queries';
import { models } from '../client';
import { useWindowSize } from 'react-use';
import { API_URI } from '../constants';
import { useDownloadFile } from '../download/useDownloadFile';
import { useHistory } from 'react-router-dom';
import { useQueryGetBooks } from '../books/queries';

export const SeriesBookList: FC<{ seriesId: string }> = ({ seriesId }) => {
  const history = useHistory();
  const classes = useStyles();
  const { data: seriesData } = useQueryGetOneSeries({ variables: { id: seriesId } })
  const downloadFile = useDownloadFile()
  const books = seriesData?.oneSeries?.books || []

  console.log('[BookList]', seriesData)

  return (
    <div
      className={classes.container}>
      {books && (
        <GridList cellHeight={300} className={classes.gridList} cols={3}>
          {books
            .map((book: any) => (
              <GridListTile
                key={book.id}
                style={{
                  cursor: 'pointer'
                }}
                onClick={() => {
                  if (!book.lastMetadataUpdatedAt) return
                  if (book.downloadState === 'none') {
                    downloadFile(book.id).catch(() => { })
                  } else if (book.downloadState === 'downloaded') {
                    history.push(`/reader/${book.id}`)
                  }
                }}
              >
                <img
                  alt="img"
                  src={`${API_URI}/cover/${book.id}`}
                  // onError={}
                  style={{
                    ...!(book.downloadState === 'downloaded') && {
                      opacity: 0.5,
                    },
                  }} />
                <div style={{
                  position: 'absolute',
                  height: '100%',
                  width: '100%',
                  top: 0,
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  {!book.lastMetadataUpdatedAt && (
                    <CircularProgress />
                  )}
                </div>
                {book.lastMetadataUpdatedAt && book.downloadState !== 'downloaded' && <GridListTileBar
                  title={book.downloadState === 'downloading' ? 'Downloading...' : <CloudDownloadRounded />}
                  titlePosition="top"
                  actionPosition="left"
                />}
                <GridListTileBar
                  title={book.lastMetadataUpdatedAt ? book.title : ''}
                  subtitle={
                    <span>{book.lastMetadataUpdatedAt ? `by: ${book.author}` : 'Fetching metadata...'}</span>
                  }
                  actionIcon={
                    <IconButton
                      aria-label={`info about ${book.title}`}
                      className={classes.icon}
                      onClick={(e) => {
                        e.stopPropagation()
                        // models.isBookActionDialogOpenedWithVar(models.isBookActionDialogOpenedWithVar(book.id))
                      }}
                    >
                      <Info />
                    </IconButton>
                  }
                />
              </GridListTile>
            ))}
        </GridList>
      )}

    </div>
  )
}

const useStyles = () => {
  const windowSize = useWindowSize()

  return useRef(makeStyles((theme) => ({
    container: {
      display: 'flex',
      height: 500,
      flexGrow: 1,
      paddingBottom: 2
    },
    gridList: {
      width: (props: any) => props.windowSize.width,
    },
    icon: {
      color: 'rgba(255, 255, 255, 0.54)',
    },
  }))).current({
    windowSize
  })
}