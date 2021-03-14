import React, { useCallback, FC, useMemo, memo } from 'react'
import { useTheme } from "@material-ui/core"
import { useWindowSize } from 'react-use';
import { BookListGridItem } from './BookListGridItem';
import { LibrarySorting } from '../../library/states';
import { LibraryViewMode } from '../../rxdb';
import { BookListListItem } from './BookListListItem';
import { useCSS } from '../../common/utils';
import { ReactWindowList } from '../../lists/ReactWindowList';

export const BookList: FC<{
  viewMode?: 'grid' | 'list',
  renderHeader?: () => React.ReactNode,
  headerHeight?: number,
  sorting?: LibrarySorting,
  isHorizontal?: boolean,
  style?: React.CSSProperties,
  itemWidth?: number,
  data: string[],
  density?: 'dense' | 'large',
  onItemClick?: (id: string) => void,
  withDrawerActions?: boolean
}> = memo((props) => {
  const { viewMode = 'grid', renderHeader, headerHeight, density = 'large', isHorizontal = false, style, data, itemWidth, onItemClick, withDrawerActions } = props
  const windowSize = useWindowSize()
  const classes = useStyle({ isHorizontal });
  const theme = useTheme()
  const dynamicNumberOfItems = Math.round(windowSize.width / 200)
  const itemsPerRow = (viewMode === 'grid' && !isHorizontal)
    ? dynamicNumberOfItems > 0 ? dynamicNumberOfItems : dynamicNumberOfItems
    : 1
  const adjustedRatioWhichConsiderBottom = theme.custom.coverAverageRatio - 0.1
  const densityMultiplier = density === 'dense' ? 0.8 : 1
  const listItemMargin = (windowSize.width > theme.breakpoints.values['sm'] ? 20 : 10) * densityMultiplier
  const itemHeight = viewMode === LibraryViewMode.GRID
    ? undefined
    : (((windowSize.width > theme.breakpoints.values['sm'] ? 200 : 150) * theme.custom.coverAverageRatio) + listItemMargin) * densityMultiplier

  const rowRenderer = useCallback((item: string) => {
    return viewMode === LibraryViewMode.GRID
      ? <BookListGridItem bookId={item} />
      : (
        <div style={{ flex: 1, alignItems: 'center', display: 'flex' }}>
          <BookListListItem
            bookId={item}
            itemHeight={(itemHeight || 0) - listItemMargin}
            onItemClick={onItemClick}
            withDrawerActions={withDrawerActions}
          />
        </div>
      )
  }, [viewMode, itemHeight, listItemMargin, onItemClick, withDrawerActions])

  console.log(`debug BookList render`, props)

  const containerStyle = useMemo(() => ({ ...classes.container, ...style }), [style, classes])

  return (
    <div style={containerStyle}>
      <ReactWindowList
        data={data}
        rowRenderer={rowRenderer}
        itemsPerRow={itemsPerRow}
        preferredRatio={adjustedRatioWhichConsiderBottom}
        headerHeight={headerHeight}
        renderHeader={renderHeader}
        layout={isHorizontal ? 'horizontal' : 'vertical'}
        itemWidth={itemWidth}
        // only used when list layout
        itemHeight={itemHeight}
      />
    </div>
  )
})

const useStyle = ({ isHorizontal }: { isHorizontal: boolean }) => {
  const theme = useTheme()

  return useCSS(() => ({
    container: {
      paddingLeft: isHorizontal ? 0 : theme.spacing(1),
      paddingRight: isHorizontal ? 0 : theme.spacing(1),
      display: 'flex',
    },
  }), [theme, isHorizontal])
}