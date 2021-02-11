import React, { ComponentProps, useCallback, FC, useMemo, memo } from 'react'
import { useTheme } from "@material-ui/core"
import { useWindowSize } from 'react-use';
import { ItemList } from '../../lists/ItemList';
import { BookListGridItem } from './BookListGridItem';
import { LibrarySorting } from '../../library/states';
import { LibraryViewMode } from '../../rxdb';
import { BookListListItem } from './BookListListItem';
import { useCSS } from '../../utils';

type CellRenderer = ComponentProps<typeof ItemList>['rowRenderer']

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
}> = memo(({ viewMode = 'grid', renderHeader, headerHeight, density = 'large', isHorizontal = false, style, data, itemWidth, onItemClick, withDrawerActions }) => {
  const windowSize = useWindowSize()
  const classes = useStyle({ isHorizontal });
  const hasHeader = !!renderHeader
  const theme = useTheme()
  const listData = useMemo(() => {
    if (hasHeader) return ['header' as const, ...data]
    else return data
  }, [data, hasHeader])
  const dynamicNumberOfItems = Math.round(windowSize.width / 200)
  const itemsPerRow = viewMode === 'grid'
    ? dynamicNumberOfItems > 0 ? dynamicNumberOfItems : dynamicNumberOfItems
    : 1
  const adjustedRatioWhichConsiderBottom = theme.custom.coverAverageRatio - 0.1
  const densityMultiplier = density === 'dense' ? 0.8 : 1
  const listItemMargin = (windowSize.width > theme.breakpoints.values['sm'] ? 20 : 10) * densityMultiplier
  const itemHeight = viewMode === LibraryViewMode.GRID
    ? undefined
    : (((windowSize.width > theme.breakpoints.values['sm'] ? 200 : 150) * theme.custom.coverAverageRatio) + listItemMargin) * densityMultiplier

  const rowRenderer: CellRenderer = useCallback((_, item): any => {
    if (item === 'header') {
      if (renderHeader) return renderHeader()
      return null
    }

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
  }, [renderHeader, viewMode, itemHeight, listItemMargin, onItemClick, withDrawerActions])

  return (
    <div style={{ ...classes.container, ...style }}>
      <ItemList
        data={listData}
        rowRenderer={rowRenderer}
        itemsPerRow={itemsPerRow}
        // only used when grid layout
        preferredRatio={adjustedRatioWhichConsiderBottom}
        headerHeight={headerHeight}
        renderHeader={renderHeader}
        isHorizontal={isHorizontal}
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