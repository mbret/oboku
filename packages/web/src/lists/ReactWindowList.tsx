import {
  ComponentProps,
  FC,
  forwardRef,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef
} from "react"
import {
  FixedSizeGrid,
  GridOnScrollProps,
  VariableSizeList
} from "react-window"
import AutoSizer from "react-virtualized-auto-sizer"
import {
  ArrowBackIosRounded,
  ArrowForwardIosRounded,
  ExpandLessRounded,
  ExpandMoreRounded
} from "@mui/icons-material"
import { decimalAdjust, useCSS } from "../common/utils"
import { useTheme } from "@mui/material"
import { useLocalSettingsState } from "../settings/states"

export const ReactWindowList: FC<{
  rowRenderer: (item: any, rowIndex: number) => React.ReactNode
  layout?: ComponentProps<typeof VariableSizeList>["layout"]
  data: any[]
  itemsPerRow: number
  preferredRatio?: number
  className?: string
  renderHeader?: () => React.ReactNode
  headerHeight?: number
  itemWidth?: number
  itemHeight?: number
  onScroll?: ComponentProps<typeof List>["onScroll"]
  initialScrollLeft?: ComponentProps<typeof List>["initialScrollLeft"]
  initialScrollTop?: ComponentProps<typeof List>["initialScrollTop"]
}> = memo(({ ...rest }) => {
  return (
    <>
      <AutoSizer>
        {({ width, height }) => (
          <List width={width ?? 0} height={height ?? 0} {...rest} />
        )}
      </AutoSizer>
    </>
  )
})

const List = memo(
  forwardRef<
    FixedSizeGrid,
    {
      width: number
      height: number
      rowRenderer: (item: string, rowIndex: number) => React.ReactNode
      layout?: ComponentProps<typeof VariableSizeList>["layout"]
      onScroll?: ComponentProps<typeof FixedSizeGrid>["onScroll"]
      initialScrollLeft?: ComponentProps<
        typeof FixedSizeGrid
      >["initialScrollLeft"]
      initialScrollTop?: ComponentProps<
        typeof FixedSizeGrid
      >["initialScrollTop"]
      data: string[]
      itemsPerRow: number
      preferredRatio?: number
      className?: string
      renderHeader?: () => React.ReactNode
      headerHeight?: number
      itemWidth?: number
      itemHeight?: number
      outerRef?: any
    }
  >(
    (
      {
        rowRenderer,
        data,
        outerRef,
        itemsPerRow,
        itemHeight,
        preferredRatio = 1,
        renderHeader,
        headerHeight,
        layout,
        itemWidth,
        width,
        height,
        onScroll,
        ...rest
      },
      _
    ) => {
      const listRef = useRef<FixedSizeGrid>()
      const scrollRef = useRef<GridOnScrollProps>()
      const computedItemWidth = itemWidth
        ? itemWidth
        : Math.floor(width / itemsPerRow)
      // @todo move it out of this generic list
      const computedItemHeight =
        itemHeight || Math.floor(computedItemWidth / preferredRatio)
      const columnCount = layout === "horizontal" ? data.length : itemsPerRow
      const { useNavigationArrows } = useLocalSettingsState()
      const classes = useClasses()
      const displayScrollerButtons = useNavigationArrows
      const isHorizontal = layout === "horizontal"
      // 18/4=4.5 so we need to take ceil 5
      const rowCount = Math.ceil(data.length / columnCount)
      const listHeightWithoutHeader = computedItemHeight * rowCount
      const listWidth = computedItemWidth * columnCount
      const maxLeftOffset = listWidth - width
      const maxTopOffset =
        (headerHeight || 0) + listHeightWithoutHeader - height

      // index will be -1 in case of header
      // because negative offset will fallback to 0 it works to handle header
      const scrollToRowIndex = (rowIndex: number) => {
        const scrollTop =
          (headerHeight || 0) + (rowIndex || 0) * computedItemHeight
        return listRef?.current?.scrollTo({
          scrollTop: scrollTop >= maxTopOffset ? maxTopOffset : scrollTop,
          scrollLeft: 0
        })
      }

      const scrollToColumnIndex = (columnIndex: number) => {
        const leftOffsetToScroll = (columnIndex || 0) * computedItemWidth
        return listRef?.current?.scrollTo({
          scrollTop: 0,
          scrollLeft:
            leftOffsetToScroll >= maxLeftOffset
              ? maxLeftOffset
              : leftOffsetToScroll
        })
      }

      const getCurrentOffsetWithoutHeader = () => {
        if (layout === "vertical") {
          return (scrollRef.current?.scrollTop || 0) - (headerHeight || 0)
        } else {
          return scrollRef.current?.scrollLeft || 0
        }
      }

      const onExpandMoreClick = () => {
        const offsetWithoutHeader = getCurrentOffsetWithoutHeader()
        // for some reason the offset will often be x.9987454 instead of x
        // we round up x.9y y>=5 to next row index
        // we try to get the smartest closest row index
        if (layout === "vertical") {
          const currentRowIndex = Math.floor(
            decimalAdjust(
              "round",
              rowCount * (offsetWithoutHeader / listHeightWithoutHeader),
              -1
            )
          )

          return scrollToRowIndex(currentRowIndex + 1)
        } else {
          const currentIndex = Math.floor(
            decimalAdjust(
              "round",
              columnCount * (offsetWithoutHeader / listWidth),
              -1
            )
          )

          return scrollToColumnIndex(currentIndex + 1)
        }
      }

      const onExpandLessClick = () => {
        const offsetWithoutHeader = getCurrentOffsetWithoutHeader()
        if (layout === "vertical") {
          const currentRowIndex = Math.ceil(
            decimalAdjust(
              "round",
              rowCount * (offsetWithoutHeader / listHeightWithoutHeader),
              -1
            )
          )

          return scrollToRowIndex(currentRowIndex - 1)
        } else {
          const currentIndex = decimalAdjust(
            "round",
            columnCount * (offsetWithoutHeader / listWidth),
            -1
          )
          const currentRoundedIndex = Math.floor(currentIndex)
          // we are in the middle of one item, let's just roll back to the begin of it
          if (!Number.isInteger(currentIndex)) {
            return scrollToColumnIndex(currentRoundedIndex)
          }
          return scrollToColumnIndex(currentRoundedIndex - 1)
        }
      }

      const innerElementType = useMemo(
        () =>
          forwardRef<any, any>(({ style, children, ...rest }, ref) => {
            return (
              <div
                ref={ref as any}
                style={{
                  ...style,
                  ...(headerHeight && {
                    height: `${parseFloat(style.height) + headerHeight}px`
                  })
                }}
                {...rest}
              >
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    width: "100%"
                  }}
                >
                  {renderHeader && renderHeader()}
                </div>
                {children}
              </div>
            )
          }),
        [renderHeader, headerHeight]
      )

      const renderItem = useCallback(
        ({ columnIndex, rowIndex, style, data }) => {
          const itemIndex = rowIndex * columnCount + columnIndex
          const item = data[itemIndex]

          return (
            <div
              key={rowIndex}
              style={{
                ...style,
                ...(headerHeight && {
                  top: `${
                    parseFloat(style.top?.toString() || "0") + headerHeight
                  }px`
                })
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: "100%",
                  maxHeight: computedItemHeight
                }}
              >
                {item && rowRenderer(item, rowIndex)}
              </div>
            </div>
          )
        },
        [columnCount, headerHeight, computedItemHeight, rowRenderer]
      )

      return (
        <>
          <FixedSizeGrid
            ref={listRef as any}
            outerRef={outerRef}
            onScroll={(scroll) => {
              scrollRef.current = scroll
              onScroll && onScroll(scroll)
            }}
            columnCount={columnCount}
            columnWidth={computedItemWidth}
            rowHeight={computedItemHeight}
            useIsScrolling={false}
            height={height}
            width={width}
            rowCount={rowCount}
            innerElementType={innerElementType}
            itemData={data}
            {...rest}
          >
            {renderItem}
          </FixedSizeGrid>
          {displayScrollerButtons && (
            <>
              {!isHorizontal && (
                <div
                  style={{
                    ...classes.verticalScrollButton,
                    ...classes.verticalScrollButtonLess
                  }}
                  onClick={onExpandLessClick}
                >
                  <ExpandLessRounded style={{ color: "white" }} />
                </div>
              )}
              {!isHorizontal && (
                <div
                  style={{
                    ...classes.verticalScrollButton,
                    ...classes.verticalScrollButtonMore
                  }}
                  onClick={onExpandMoreClick}
                >
                  <ExpandMoreRounded style={{ color: "white" }} />
                </div>
              )}
              {isHorizontal && (
                <div
                  style={{
                    ...classes.horizontalButton,
                    position: "absolute",
                    left: 5
                  }}
                  onClick={onExpandLessClick}
                >
                  <ArrowBackIosRounded style={{ color: "white" }} />
                </div>
              )}
              {isHorizontal && (
                <div
                  style={{
                    ...classes.horizontalButton,
                    position: "absolute",
                    right: 5
                  }}
                  onClick={onExpandMoreClick}
                >
                  <ArrowForwardIosRounded style={{ color: "white" }} />
                </div>
              )}
            </>
          )}
        </>
      )
    }
  )
)

const useClasses = () => {
  const theme = useTheme()

  return useCSS(
    () => ({
      verticalScrollButton: {
        position: "absolute",
        padding: theme.spacing(2),
        backgroundColor: "gray",
        opacity: 0.5,
        borderRadius: 50,
        alignItems: "center",
        justifyContent: "center",
        bottom: theme.spacing(1),
        display: "flex"
      },
      verticalScrollButtonMore: {
        right: theme.spacing(1)
      },
      verticalScrollButtonLess: {
        left: theme.spacing(1)
      },
      horizontalButton: {
        padding: theme.spacing(2),
        backgroundColor: "gray",
        opacity: 0.5,
        borderRadius: 50,
        alignItems: "center",
        justifyContent: "center",
        transform: "translateY(-50%)",
        top: "50%",
        display: "flex",
        flexFlow: "column"
      }
    }),
    [theme]
  )
}
