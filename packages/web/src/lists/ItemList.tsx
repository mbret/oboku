import React, { useMemo, FC, ComponentProps, useRef, useEffect } from 'react'
import { useScrollbarWidth, useMeasure } from 'react-use';
import { RecyclerListView, DataProvider, LayoutProvider } from "recyclerlistview/web";
import { ArrowBackIosRounded, ArrowForwardIosRounded, ExpandMoreRounded, ExpandLessRounded } from '@material-ui/icons';
import { useTheme } from '@material-ui/core';
import { Report } from '../report';
import { useRecoilValue } from 'recoil';
import { localSettingsState } from '../settings/states';
import { UseMeasureResult } from 'react-use/lib/useMeasure';
import { useCSS } from '../misc/utils';

// Create the data provider and provide method which takes in two rows of data and return if those two are different or not.
// THIS IS VERY IMPORTANT, FORGET PERFORMANCE IF THIS IS MESSED UP
const initialDataProvider = new DataProvider((r1, r2) => {
  return r1 !== r2;
})

export const ItemList: FC<{
  rowRenderer: ComponentProps<typeof RecyclerListView>['rowRenderer'],
  isHorizontal: ComponentProps<typeof RecyclerListView>['isHorizontal'],
  data: any[],
  itemsPerRow: number,
  preferredRatio?: number,
  className?: string,
  renderHeader?: () => React.ReactNode,
  headerHeight?: number,
  itemWidth?: number,
  itemHeight?: number,
}> = ({ rowRenderer, data, itemsPerRow, itemHeight, preferredRatio = 1, className, renderHeader, headerHeight, isHorizontal, itemWidth }) => {
  const classes = useClasses()
  const sbw = useScrollbarWidth() || 0;
  const listRef = useRef<RecyclerListView<any, any>>()
  const [ref, { width }] = useMeasure() as UseMeasureResult;
  const maxWidth = (width - sbw)
  const hasHeader = !!renderHeader
  const computedItemWidth = itemWidth ? itemWidth : Math.floor(maxWidth / itemsPerRow)
  const computedItemHeight = itemHeight || computedItemWidth / preferredRatio
  const { useNavigationArrows } = useRecoilValue(localSettingsState)
  const displayScrollerButtons = (hasHeader ? data.length > 1 : data.length > 0) && useNavigationArrows

  // Create the layout provider
  // First method: Given an index return the type of item e.g ListItemType1, ListItemType2 in case you have variety of items in your list/grid
  // Second: Given a type and object set the exact height and width for that type on given object, if you're using non deterministic rendering provide close estimates
  // If you need data based check you can access your data provider here
  // You'll need data in most cases, we don't provide it by default to enable things like data virtualization in the future
  // NOTE: For complex lists LayoutProvider will also be complex it would then make sense to move it to a different file
  const layoutProvider = useMemo(() => new LayoutProvider(
    index => hasHeader && index === 0 ? 'header' : 'item',
    (type, dim) => {
      switch (type) {
        case 'header': {
          dim.width = maxWidth
          dim.height = headerHeight || 0
          break
        }
        default: {
          dim.width = computedItemWidth
          dim.height = computedItemHeight
        }
      }
    }
  ), [computedItemWidth, computedItemHeight, hasHeader, headerHeight, maxWidth])

  /**
   * Ugly hack but because we don't want to use the window for scroll and resize (since we have custom dimension)
   * the resize is not being listened to (https://github.com/Flipkart/recyclerlistview/blob/5500b6bbfd098868c11db83311d3d35ae742f991/src/platform/web/scrollcomponent/ScrollViewer.tsx#L28)
   * It is only being listened when it's on window. Anyway we have a dynamic dimensions so we just force a resize whenever
   * the width change. It's using internal API and is not safe. One day I will need to create my own external view or fix the
   * library...
   */
  useEffect(() => {
    if (maxWidth > 0) {
      try {
        // @ts-ignore
        listRef.current?._onSizeChanged({ height: listRef.current?._layout.height, width: maxWidth })
      } catch (e) {
        Report.error(e)
      }
    }
  }, [maxWidth])

  const getOffsets = () => isHorizontal
    ? data.map((_, i) => Math.floor(listRef?.current?.getLayout(i)?.x || 0))
    : data.map((_, i) => Math.floor(listRef?.current?.getLayout(i)?.y || 0))

  const dataProvider = useMemo(() => initialDataProvider.cloneWithRows(data), [data])

  const getNextOffset = (offset: number) => {
    const offsets = getOffsets()
    return offsets.find(x => x > offset) || offset
  }

  const getPrevOffset = (offset: number) => {
    const offsets = getOffsets()
    return offsets.reverse().find(x => x < offset) || 0
  }

  const onExpandMoreClick = () => {
    // sometimes the offset is a bit off like "149.9" which will get a next offset of "150"
    // whereas we were supposed to go after it.
    const offset = Math.round(listRef?.current?.getCurrentScrollOffset() || 0)
    const nextOffset = getNextOffset(offset)
    if (isHorizontal) {
      listRef?.current?.scrollToOffset(nextOffset, 0, false)
    } else {
      listRef?.current?.scrollToOffset(0, nextOffset, false)
    }
  }

  const onExpandLessClick = () => {
    const offset = listRef?.current?.getCurrentScrollOffset() || 0
    const nextOffset = getPrevOffset(offset)
    if (isHorizontal) {
      listRef?.current?.scrollToOffset(nextOffset, 0, false)
    } else {
      listRef?.current?.scrollToOffset(0, nextOffset, false)
    }
  }

  // @ts-ignore
  window.list = listRef

  const scrollViewProps = useMemo(() => ({
    showsVerticalScrollIndicator: false,
    useWindowScroll: false,
    canChangeSize: true,
  }), [])

  return (
    <div style={{
      display: 'flex',
      flex: `0 0 100%`,
      width: '100%',
      position: 'relative',
    }}
      className={className}
      ref={ref as any}
    >
      {data.length > 0 && (
        <RecyclerListView
          ref={listRef as any}
          layoutProvider={layoutProvider}
          dataProvider={dataProvider}
          rowRenderer={rowRenderer}
          canChangeSize={true}
          isHorizontal={isHorizontal}
          scrollViewProps={scrollViewProps}
          renderAheadOffset={10}
        />
      )}
      {displayScrollerButtons && (
        <>
          {!isHorizontal && (
            <div
              style={{
                ...classes.verticalScrollButton,
                ...classes.verticalScrollButtonLess,
              }}
              onClick={onExpandLessClick}
            >
              <ExpandLessRounded style={{ color: 'white' }} />
            </div>
          )}
          {!isHorizontal && (
            <div
              style={{
                ...classes.verticalScrollButton,
                ...classes.verticalScrollButtonMore,
              }}
              onClick={onExpandMoreClick}
            >
              <ExpandMoreRounded style={{ color: 'white' }} />
            </div>
          )}
          {isHorizontal && (
            <div
              style={{
                ...classes.horizontalButton,
                position: 'absolute',
                left: 5,
              }}
              onClick={onExpandLessClick}
            >
              <ArrowBackIosRounded style={{ color: 'white' }} />
            </div>
          )}
          {isHorizontal && (
            <div
              style={{
                ...classes.horizontalButton,
                position: 'absolute',
                right: 5,
              }}
              onClick={onExpandMoreClick}
            >
              <ArrowForwardIosRounded style={{ color: 'white' }} />
            </div>
          )}
        </>
      )}
    </div>
  )
}

const useClasses = () => {
  const theme = useTheme()

  return useCSS(() => ({
    verticalScrollButton: {
      position: 'absolute',
      padding: theme.spacing(2),
      backgroundColor: 'gray',
      opacity: 0.5,
      borderRadius: 50,
      alignItems: 'center',
      justifyContent: 'center',
      bottom: theme.spacing(1),
      display: 'flex',
    },
    verticalScrollButtonMore: {
      right: theme.spacing(1),
    },
    verticalScrollButtonLess: {
      left: theme.spacing(1),
    },
    horizontalButton: {
      padding: theme.spacing(2),
      backgroundColor: 'gray',
      opacity: 0.5,
      borderRadius: 50,
      alignItems: 'center',
      justifyContent: 'center',
      transform: 'translateY(-50%)',
      top: '50%',
      display: 'flex',
      flexFlow: 'column',
    }
  }), [theme])
}