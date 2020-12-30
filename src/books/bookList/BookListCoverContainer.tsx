import React, { FC } from 'react'
import { Box, makeStyles, Chip } from "@material-ui/core"
import { CloudDownloadRounded, LoopRounded, Pause } from '@material-ui/icons';
import { useWindowSize } from 'react-use';
import { Cover } from '../Cover';
import { useRecoilValue } from 'recoil';
import { enrichedBookState } from '../states';
import { ReadingStateState } from 'oboku-shared'
import { ReadingProgress } from './ReadingProgress'
import { theme } from '../../theme';
import { DownloadState } from '../../download/states';

export const BookListCoverContainer: FC<{
  bookId: string,
  className?: string,
  withReadingProgressStatus?: boolean
  withDownloadStatus?: boolean
  withMetadaStatus?: boolean
}> = ({ bookId, className, withMetadaStatus = true, withDownloadStatus = true, withReadingProgressStatus = true }) => {
  const item = useRecoilValue(enrichedBookState(bookId))
  const windowSize = useWindowSize()
  const classes = useStyles({ windowSize });

  return (
    <div className={`${classes.coverContainer} ${className}`}>
      {item && <Cover bookId={item?._id} />}
      {item?.downloadState !== DownloadState.Downloaded && (
        <div style={{
          backgroundColor: 'white',
          opacity: 0.5,
          height: item?.downloadState === DownloadState.Downloading
            ? `${100 - (item?.downloadProgress || 0)}%`
            : `100%`,
          width: '100%',
          position: 'absolute',
          top: 0,
        }} />
      )}
      <Box
        flexDirection="column"
        alignItems="center"
        style={{
          position: 'absolute',
          height: '100%',
          width: '100%',
          top: 0,
          display: 'flex',
          padding: theme.spacing(1),
        }}>
        {(withMetadaStatus && !item?.lastMetadataUpdatedAt) && (
          <Box className={classes.itemCoverCenterInfo}>
            <Chip color="secondary" size="small" icon={<LoopRounded color="primary" className="icon-spin" />} label="metadata..." />
          </Box>
        )}
        {item?.downloadState === 'none' && (
          <Box position="absolute" left="50%" top="50%" style={{ transform: 'translate(-50%, -50%)' }}>
            <CloudDownloadRounded color="secondary" />
          </Box>
        )}
        {(withDownloadStatus && item?.downloadState === 'downloading') && (
          <Box position="absolute" left="50%" top="50%" style={{ transform: 'translate(-50%, -50%)' }}>
            <Chip color="secondary" size="small" icon={<Pause />} label="downloading..." />
          </Box>
        )}
      </Box>
      {withReadingProgressStatus && (
        <>
          {item?.readingStateCurrentState === ReadingStateState.Reading && (
            <ReadingProgress
              progress={(item?.readingStateCurrentBookmarkProgressPercent || 0) * 100}
              style={{
                position: 'absolute',
                bottom: 0,
                left: '50%',
                transform: 'translateX(-50%)',
              }} />
          )}
        </>
      )}
    </div>
  )
}

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
  }
})