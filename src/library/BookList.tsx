import React, { useCallback, FC, useMemo } from 'react'
import { CircularProgress, makeStyles, Typography, Button, useTheme } from "@material-ui/core"
import { CloudDownloadRounded, MoreVert, Pause } from '@material-ui/icons';
import { models } from '../client';
import { useWindowSize, useScrollbarWidth } from 'react-use';
import { ROUTES } from '../constants';
import { useDownloadFile } from '../download/useDownloadFile';
import { useHistory } from 'react-router-dom';
import { ItemList } from '../lists/ItemList';
import { LibraryBooksSettings } from './queries';
import { LocalBook } from '../books/types';
import { Cover } from '../books/Cover';

export const BookList: FC<{
  viewMode?: 'grid' | 'list',
  renderHeader?: () => React.ReactNode,
  headerHeight?: number,
  sorting?: LibraryBooksSettings['sorting'],
  isHorizontal?: boolean,
  style?: React.CSSProperties,
  itemWidth?: number,
  data: LocalBook[],
}> = ({ viewMode = 'grid', renderHeader, headerHeight, sorting, isHorizontal = false, style, itemWidth, data }) => {
  const history = useHistory();
  const sbw = useScrollbarWidth() || 0;
  const windowSize = useWindowSize()
  const classes = useStyles({ isHorizontal, windowSize });
  const downloadFile = useDownloadFile()
  const hasHeader = !!renderHeader
  const theme = useTheme()
  const listData = useMemo(() => {
    if (hasHeader) return ['header' as const, ...data]
    else return data
  }, [data, hasHeader])
  const itemsPerRow = viewMode === 'grid'
    ? windowSize.width > 420 ? 3 : 2
    : 1
  const adjustedRatioWhichConsiderBottom = theme.custom.coverAverageRatio - 0.1

  type ListDataItem = (typeof listData)[number]
  const rowRenderer = useCallback((type, item: ListDataItem) => {
    if (item === 'header') {
      if (renderHeader) return renderHeader()
      return null
    }

    return (
      <div
        key={item.id}
        className={classes.itemContainer}
        onClick={() => {
          if (!item.lastMetadataUpdatedAt) return
          if (item.downloadState === 'none') {
            item.id && downloadFile(item.id).catch(() => { })
          } else if (item.downloadState === 'downloaded') {
            history.push(ROUTES.READER.replace(':id', item.id))
          }
        }}
      >
        <div
          style={{
            position: 'relative',
            flexGrow: 1,
            width: '100%',
            minHeight: 0,
          }}
        >
          <Cover bookId={item.id} />
          {item.downloadState === 'downloading' && (
            <div style={{
              backgroundColor: 'white',
              opacity: 0.5,
              height: `${100 - (item.downloadProgress || 0)}%`,
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
            {!item.lastMetadataUpdatedAt && (
              <div className={classes.itemCoverCenterInfo}>
                <CircularProgress size="1rem" />&nbsp;
                <Typography noWrap>Refresh...</Typography>
              </div>
            )}
            {item.lastMetadataUpdatedAt && item.downloadState === 'none' && (
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
            {item.downloadState === 'downloading' && (
              <div className={classes.itemCoverCenterInfo}>
                <Pause />&nbsp;
                <Typography noWrap>Downloading...</Typography>
              </div>
            )}
          </div>
        </div>
        <div
          className={classes.itemBottomContainer}
          onClick={(e) => {
            e.stopPropagation()
            item.id && models.isBookActionDialogOpenedWithVar(models.isBookActionDialogOpenedWithVar(item.id))
          }}
        >
          <div style={{ width: '100%', overflow: 'hidden' }}>
            <Typography variant="body2" className={classes.itemTitle}>{item?.title || 'Unknown'}</Typography>
            <Typography variant="caption">{item?.creator || 'Unknown'}</Typography>
          </div>
          <MoreVert style={{ transform: 'translate(50%, 0%)' }} />
        </div>
      </div >
    )
  }, [classes, downloadFile, history, renderHeader])

  return (
    <div className={classes.container} style={style}>
      <ItemList
        data={listData}
        rowRenderer={rowRenderer as any}
        itemsPerRow={itemsPerRow}
        preferredRatio={adjustedRatioWhichConsiderBottom}
        headerHeight={headerHeight}
        renderHeader={renderHeader}
        isHorizontal={isHorizontal}
        itemWidth={itemWidth}
      />
    </div>
  )
}



const useStyles = makeStyles((theme) => {
  type Props = { isHorizontal: boolean, windowSize: { width: number } }

  return {
    container: {
      paddingLeft: (props: Props) => props.isHorizontal ? 0 : theme.spacing(1),
      paddingRight: (props: Props) => props.isHorizontal ? 0 : theme.spacing(1),
      display: 'flex',
      // flexFlow: 'column',
    },
    itemContainer: {
      cursor: 'pointer',
      height: '100%',
      position: 'relative',
      boxSizing: 'border-box',
      display: 'flex',
      flexFlow: 'column',
      padding: (props: Props) => theme.spacing(1),
      // border: '1px solid blue',
    },
    itemBottomContainer: {
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
    gridList: {
      width: (props: Props) => props.windowSize.width,
    },
  }
})