import React, { useCallback, FC, memo, ReactNode } from "react"
import { Box, useTheme } from "@mui/material"
import { useWindowSize } from "react-use"
import { BookListGridItem } from "./BookListGridItem"
import { LibrarySorting } from "../../library/states"
import { BookListListItem } from "./BookListListItem"
import { ReactWindowList } from "../../common/lists/ReactWindowList"
import { ListActionViewMode } from "../../common/lists/ListActionsToolbar"
import { BookListCompactItem } from "./BookListCompactItem"
import { useListItemHeight } from "./useListItemHeight"

const ItemListContainer = ({
  children,
  isLast,
  borders = false
}: {
  children: ReactNode
  isLast: boolean
  borders?: boolean
}) => (
  <Box
    style={{
      flex: 1,
      alignItems: "center",
      display: "flex",
      height: "100%"
    }}
    {...(!isLast &&
      borders && {
        borderBottom: "1px solid",
        borderColor: "grey.200"
      })}
  >
    {children}
  </Box>
)

export const BookList: FC<{
  viewMode?: ListActionViewMode
  renderHeader?: () => React.ReactNode
  headerHeight?: number
  sorting?: LibrarySorting
  isHorizontal?: boolean
  style?: React.CSSProperties
  itemWidth?: number
  data: string[]
  density?: "dense" | "large"
  onItemClick?: (id: string) => void
  withBookActions?: boolean
  static?: boolean
}> = memo((props) => {
  const {
    viewMode = "grid",
    renderHeader,
    headerHeight,
    density = "large",
    isHorizontal = false,
    style,
    data,
    itemWidth,
    onItemClick,
    withBookActions
  } = props
  const windowSize = useWindowSize()
  const theme = useTheme()
  const dynamicNumberOfItems = Math.round(windowSize.width / 200)
  const itemsPerRow =
    viewMode === "grid" && !isHorizontal
      ? dynamicNumberOfItems > 0
        ? dynamicNumberOfItems
        : dynamicNumberOfItems
      : 1
  const adjustedRatioWhichConsiderBottom = theme.custom.coverAverageRatio - 0.1
  const { itemHeight, itemMargin } = useListItemHeight({
    density,
    viewMode
  })

  // const rowBorderColor = theme.palette.grey[100]

  const rowRenderer = useCallback(
    (item: string, _: number, isLast: boolean) => {
      return viewMode === "grid" ? (
        <BookListGridItem bookId={item} />
      ) : viewMode === "list" ? (
        <ItemListContainer isLast={isLast}>
          <BookListListItem
            bookId={item}
            itemHeight={(itemHeight || 0) - itemMargin}
            onItemClick={onItemClick}
            withDrawerActions={withBookActions}
            pl={1}
          />
        </ItemListContainer>
      ) : (
        <ItemListContainer isLast={isLast} borders>
          <BookListCompactItem
            bookId={item}
            itemHeight={(itemHeight || 0) - itemMargin}
            onItemClick={onItemClick}
            withDrawerActions={withBookActions}
            pl={1}
          />
        </ItemListContainer>
      )
    },
    [viewMode, itemHeight, itemMargin, onItemClick, withBookActions]
  )

  if (props.static) {
    return (
      <Box
        style={style}
        px={isHorizontal ? 0 : 1}
        display="flex"
        flexDirection="column"
      >
        {data.map((item, index) => (
          <Box key={item} height={itemHeight}>
            {rowRenderer(item, index, index === data.length - 1)}
          </Box>
        ))}
      </Box>
    )
  }

  return (
    <Box style={style} display="flex">
      <ReactWindowList
        data={data}
        rowRenderer={rowRenderer}
        itemsPerRow={itemsPerRow}
        preferredRatio={adjustedRatioWhichConsiderBottom}
        headerHeight={headerHeight}
        renderHeader={renderHeader}
        layout={isHorizontal ? "horizontal" : "vertical"}
        itemWidth={itemWidth}
        // only used when list layout
        itemHeight={itemHeight}
      />
    </Box>
  )
})
