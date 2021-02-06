import React, { FC, memo, useEffect } from 'react'
import { Box, makeStyles, Chip } from "@material-ui/core"
import { CloudDownloadRounded, LoopRounded, Pause } from '@material-ui/icons';
import { useRafState, useWindowSize } from 'react-use';
import { Cover } from '../Cover';
import { useRecoilValue, UnwrapRecoilValue } from 'recoil';
import { enrichedBookState, normalizedBooksState } from '../states';
import { BookDocType, ReadingStateState } from 'oboku-shared'
import { ReadingProgress } from './ReadingProgress'
import { theme } from '../../theme';
import { DownloadState } from '../../download/states';

type Book = UnwrapRecoilValue<ReturnType<typeof enrichedBookState>>

export const BookListCoverContainer: FC<{
  bookId: string,
  className?: string,
  withReadingProgressStatus?: boolean
  withDownloadStatus?: boolean
  withMetadaStatus?: boolean
}> = memo(({ bookId, className, withMetadaStatus = true, withDownloadStatus = true, withReadingProgressStatus = true }) => {
  const item = useRecoilValue(enrichedBookState(bookId))
  const classes = useStyles({ item });
  const [render, setRender] = useRafState(false)

  useEffect(() => {
    setRender(true)
  }, [setRender])

  return (
    <div className={`${classes.coverContainer} ${className}`}>
      {!render
        ? (
          null
        )
        : (
          <>
            {item && <Cover bookId={item?._id} />}
            {item?.downloadState !== DownloadState.Downloaded && (
              <div className={classes.downloadOverlay} />
            )}
            <Box
              flexDirection="column"
              alignItems="center"
              className={classes.bodyContainer}>
              {(withMetadaStatus && !item?.lastMetadataUpdatedAt) && (
                <Box className={classes.itemCoverCenterInfo}>
                  <Chip color="secondary" size="small" icon={<LoopRounded color="primary" className="icon-spin" />} label="metadata..." />
                </Box>
              )}
              {item?.downloadState === 'none' && (
                <Box position="absolute" left="50%" top="50%" className={classes.pauseButton}>
                  <CloudDownloadRounded color="secondary" />
                </Box>
              )}
              {(withDownloadStatus && item?.downloadState === 'downloading') && (
                <Box position="absolute" left="50%" top="50%" className={classes.pauseButton}>
                  <Chip
                    color="secondary"
                    size="small"
                    //  icon={<Pause />} 
                    label="downloading..."
                  />
                </Box>
              )}
            </Box>
            {withReadingProgressStatus && (
              <>
                {item?.readingStateCurrentState === ReadingStateState.Reading && (
                  <ReadingProgress
                    progress={(item?.readingStateCurrentBookmarkProgressPercent || 0) * 100}
                    className={classes.readingProgress} />
                )}
              </>
            )}
          </>
        )}
    </div>
  )
})

const useStyles = makeStyles((theme) => {
  return {
    coverContainer: {
      position: 'relative',
      display: 'flex',
      minHeight: 0 // @see https://stackoverflow.com/questions/42130384/why-should-i-specify-height-0-even-if-i-specified-flex-basis-0-in-css3-flexbox
    },
    itemCoverCenterInfo: {
      display: 'flex',
      overflow: 'hidden',
    },
    itemCoverCenterInfoText: {

    },
    bodyContainer: {
      position: 'absolute',
      height: '100%',
      width: '100%',
      top: 0,
      display: 'flex',
      padding: theme.spacing(1),
    },
    readingProgress: {
      position: 'absolute',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
    },
    pauseButton: { transform: 'translate(-50%, -50%)' },
    downloadOverlay: {
      backgroundColor: 'white',
      opacity: 0.5,
      height: ({ item }: { item: Book }) => item?.downloadState === DownloadState.Downloading
        ? `${100 - (item?.downloadProgress || 0)}%`
        : `100%`,
      width: '100%',
      position: 'absolute',
      top: 0,
    }
  }
})