import {
  ComponentProps,
  FC,
  forwardRef,
  memo,
  useCallback,
  useMemo,
  useRef
} from "react"
import {
  FixedSizeGrid,
  GridOnScrollProps,
  VariableSizeList
} from "react-window"
import AutoSizer from "react-virtualized-auto-sizer"
import { useCSS } from "../common/utils"
import { useTheme } from "@mui/material"

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
      // 18/4=4.5 so we need to take ceil 5
      const rowCount = Math.ceil(data.length / columnCount)

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
