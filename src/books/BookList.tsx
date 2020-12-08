import React, { useCallback, FC, useMemo } from 'react'
import { makeStyles, useTheme } from "@material-ui/core"
import { useWindowSize } from 'react-use';
import { ItemList } from '../lists/ItemList';
import { BookListGridItem } from './BookListGridItem';
import { LibrarySorting } from '../library/states';

export const BookList: FC<{
  viewMode?: 'grid' | 'list',
  renderHeader?: () => React.ReactNode,
  headerHeight?: number,
  sorting?: LibrarySorting,
  isHorizontal?: boolean,
  style?: React.CSSProperties,
  itemWidth?: number,
  data: string[],
}> = ({ viewMode = 'grid', renderHeader, headerHeight, sorting, isHorizontal = false, style, itemWidth, data }) => {
  const windowSize = useWindowSize()
  const classes = useStyles({ isHorizontal, windowSize });
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

    return <BookListGridItem bookId={item} />
  }, [renderHeader])

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