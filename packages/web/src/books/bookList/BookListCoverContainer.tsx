import React, { FC, memo, useEffect } from 'react'
import { Chip, useTheme } from "@material-ui/core"
import { CloudDownloadRounded, ErrorRounded, LoopRounded } from '@material-ui/icons';
import { useRafState } from 'react-use';
import { Cover } from '../Cover';
import { useRecoilValue, UnwrapRecoilValue } from 'recoil';
import { enrichedBookState } from '../states';
import { ReadingStateState } from '@oboku/shared'
import { ReadingProgress } from './ReadingProgress'
import { DownloadState } from '../../download/states';
import { useCSS } from '../../misc/utils';

type Book = UnwrapRecoilValue<ReturnType<typeof enrichedBookState>>

export const BookListCoverContainer: FC<{
  bookId: string,
  className?: string,
  style?: React.CSSProperties,
  withReadingProgressStatus?: boolean
  withDownloadStatus?: boolean
  withMetadaStatus?: boolean
}> = memo(({ bookId, className, withMetadaStatus = true, style, withDownloadStatus = true, withReadingProgressStatus = true }) => {
  const item = useRecoilValue(enrichedBookState(bookId))
  const classes = useStyles({ item });
  const [render, setRender] = useRafState(false)

  useEffect(() => {
    setRender(true)
  }, [setRender])

  return (
    <div style={{ ...classes.coverContainer, ...style }} className={className}>
      {!render
        ? (
          null
        )
        : (
          <>
            {item && <Cover bookId={item?._id} />}
            {item?.downloadState !== DownloadState.Downloaded && (
              <div style={classes.downloadOverlay} />
            )}
            <div
              style={classes.bodyContainer}>
              {(withMetadaStatus && item?.metadataUpdateStatus === 'fetching') && (
                <div style={classes.itemCoverCenterInfo}>
                  <Chip color="secondary" size="small" icon={<LoopRounded color="primary" className="icon-spin" />} label="metadata..." />
                </div>
              )}
              {(withMetadaStatus && item?.metadataUpdateStatus !== 'fetching' && !!item?.lastMetadataUpdateError) && (
                <div style={classes.itemCoverCenterInfo}>
                  <Chip color="secondary" size="small" icon={<ErrorRounded color="primary" />} label="metadata" />
                </div>
              )}
              {item?.downloadState === 'none' && (
                <div style={classes.pauseButton}>
                  <CloudDownloadRounded color="secondary" />
                </div>
              )}
              {(withDownloadStatus && item?.downloadState === 'downloading') && (
                <div style={classes.pauseButton}>
                  <Chip
                    color="secondary"
                    size="small"
                    //  icon={<Pause />} 
                    label="downloading..."
                  />
                </div>
              )}
            </div>
            {withReadingProgressStatus && (
              <>
                {item?.readingStateCurrentState === ReadingStateState.Reading && (
                  <ReadingProgress
                    progress={(item?.readingStateCurrentBookmarkProgressPercent || 0) * 100}
                    style={classes.readingProgress} />
                )}
              </>
            )}
          </>
        )}
    </div>
  )
})

const useStyles = ({ item }: { item: Book }) => {
  const theme = useTheme()

  return useCSS(() => ({
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
      flexDirection: "column",
      alignItems: "center",
    },
    readingProgress: {
      position: 'absolute',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
    },
    pauseButton: {
      transform: 'translate(-50%, -50%)',
      position: "absolute", left: "50%", top: "50%"
    },
    downloadOverlay: {
      backgroundColor: 'white',
      opacity: 0.5,
      height: item?.downloadState === DownloadState.Downloading
        ? `${100 - (item?.downloadProgress || 0)}%`
        : `100%`,
      width: '100%',
      position: 'absolute',
      top: 0,
    }
  }), [theme, item])
}