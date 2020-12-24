import React, { FC } from 'react'
import { CircularProgress, makeStyles, Typography, useTheme } from "@material-ui/core"
import { CloudDownloadRounded, MenuBookRounded, MoreVert, Pause } from '@material-ui/icons';
import { useWindowSize } from 'react-use';
import { Cover } from '../books/Cover';
import { useRecoilState, useRecoilValue } from 'recoil';
import { bookActionDrawerState } from './BookActionsDrawer';
import { enrichedBookState } from './states';
import { ReadingStateState } from 'oboku-shared'
import { useDefaultItemClickHandler } from './listHelpers';

export const BookListGridItem: FC<{
  bookId: string,
  onItemClick?: (id: string) => void,
}> = ({ bookId, onItemClick }) => {
  const item = useRecoilValue(enrichedBookState(bookId))
  const onDefaultItemClick = useDefaultItemClickHandler()
  const windowSize = useWindowSize()
  const classes = useStyles({ windowSize });
  const [, setBookActionDrawerState] = useRecoilState(bookActionDrawerState)

  return (
    <div
      key={item?._id}
      className={classes.itemContainer}
      onClick={() => {
        if (onItemClick) return onItemClick(bookId)
        return onDefaultItemClick(bookId)
      }}
    >
      <div
        style={{
          position: 'relative',
          flex: 1,
        }}
      >
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
      </div>
      <div
        className={classes.itemBottomContainer}
        onClick={(e) => {
          e.stopPropagation()
          item?._id && setBookActionDrawerState({ openedWith: item._id })
        }}
      >
        <div style={{ width: '100%', overflow: 'hidden' }}>
          <Typography variant="body2" className={classes.itemTitle}>{item?.title || 'Unknown'}</Typography>
          <Typography variant="caption" noWrap={true} display="block">{item?.creator || 'Unknown'}</Typography>
        </div>
        <MoreVert style={{ transform: 'translate(50%, 0%)' }} />
      </div>
    </div >
  )
}

const ReadingProgress: FC<{ style: React.CSSProperties, progress: number }> = ({ style, progress }) => {
  const theme = useTheme()

  return (
    <div style={{
      ...style,
    }}>
      <MenuBookRounded style={{ opacity: '50%', fontSize: 60 }} />
      <Typography
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          color: 'white',
          textShadow: '0px 0px 3px black',
          fontWeight: theme.typography.fontWeightBold,
        }}>{Math.floor(progress) || 1}%</Typography>
    </div>
  )
}

const useStyles = makeStyles((theme) => {
  type Props = { windowSize: { width: number } }

  return {
    itemContainer: {
      cursor: 'pointer',
      height: '100%',
      position: 'relative',
      display: 'flex',
      flexFlow: 'column',
      padding: (props: Props) => theme.spacing(1),
    },
    itemBottomContainer: {
      // border: '1px solid red',
      boxSizing: 'border-box',
      width: '100%',
      height: 50,
      minHeight: 50,
      flexFlow: 'row',
      display: 'flex',
      alignItems: 'center',
      paddingLeft: 2,
      paddingRight: 5,
    },
    itemTitle: {
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
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