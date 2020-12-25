import React, { FC } from 'react'
import { CircularProgress, makeStyles, Typography } from "@material-ui/core"
import { CloudDownloadRounded, Pause } from '@material-ui/icons';
import { useWindowSize } from 'react-use';
import { Cover } from '../Cover';
import { useRecoilValue } from 'recoil';
import { enrichedBookState } from '../states';
import { ReadingStateState } from 'oboku-shared'
import { ReadingProgress } from './ReadingProgress'

export const BookListCoverContainer: FC<{
  bookId: string,
  className?: string,
  withReadingProgress?: boolean
}> = ({ bookId, className, withReadingProgress = true }) => {
  const item = useRecoilValue(enrichedBookState(bookId))
  const windowSize = useWindowSize()
  const classes = useStyles({ windowSize });

  return (
    <div className={`${classes.coverContainer} ${className}`}>
      {item && <Cover bookId={item?._id} />}
      {item?.downloadState === 'downloading' && (
        <div style={{
          backgroundColor: 'white',
          opacity: 0.5,
          height: `${100 - (item?.downloadProgress || 0)}%`,
          width: '100%',
          position: 'absolute',
          top: 0,
        }} />
      )}
      <div style={{
        position: 'absolute',
        height: '100%',
        width: '100%',
        top: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        {!item?.lastMetadataUpdatedAt && (
          <div className={classes.itemCoverCenterInfo}>
            <CircularProgress size="1rem" />&nbsp;
            <Typography noWrap>Refresh...</Typography>
          </div>
        )}
        {item?.lastMetadataUpdatedAt && item?.downloadState === 'none' && (
          <>
            <div style={{
              backgroundColor: 'white',
              opacity: 0.5,
              height: '100%',
              width: '100%',
              position: 'absolute',
              top: 0,
            }} />
            <CloudDownloadRounded />
          </>
        )}
        {item?.downloadState === 'downloading' && (
          <div className={classes.itemCoverCenterInfo}>
            <Pause />&nbsp;
            <Typography noWrap>Downloading...</Typography>
          </div>
        )}
      </div>
      {withReadingProgress && (
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

const useStyles = makeStyles(() => {
  return {
    coverContainer: {
      position: 'relative',
      display: 'flex',
      // flex: 1,
      // marginTop: (props: Props) => theme.spacing(1),
      minHeight: 0 // @see https://stackoverflow.com/questions/42130384/why-should-i-specify-height-0-even-if-i-specified-flex-basis-0-in-css3-flexbox
    },
    itemCoverCenterInfo: {
      display: 'flex',
      alignItems: 'center',
      overflow: 'hidden',
      width: '90%',
      justifyContent: 'center',
    },
    itemCoverCenterInfoText: {

    },
  }
})