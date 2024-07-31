import React, { useCallback, FC, memo, ReactNode, ComponentProps } from "react"
import { Box, BoxProps, Stack, useTheme } from "@mui/material"
import { useWindowSize } from "react-use"
import { BookListGridItem } from "./BookListGridItem"
import { LibrarySorting } from "../../library/states"
import { BookListListItem } from "./BookListListItem"
import { ListActionViewMode } from "../../common/lists/ListActionsToolbar"
import { BookListCompactItem } from "./BookListCompactItem"
import { useListItemHeight } from "./useListItemHeight"
import { VirtuosoList } from "../../common/lists/VirtuosoList"

const ItemListContainer = ({
  children,
  isLast,
  borders = false,
  ...rest
}: {
  children: ReactNode
  isLast: boolean
  borders?: boolean
} & BoxProps) => (
  <Box
    style={{
      flex: 1,
      alignItems: "center",
      display: "flex"
    }}
    {...(!isLast &&
      borders && {
        borderBottom: "1px solid",
        borderColor: "grey.200"
      })}
    {...rest}
  >
    {children}
  </Box>
)

export const BookList = memo(
  (
    props: {
      viewMode?: ListActionViewMode
      sorting?: LibrarySorting
      isHorizontal?: boolean
      itemWidth?: number
      density?: "dense" | "large"
      onItemClick?: (id: string) => void
      withBookActions?: boolean
      static?: boolean
    } & ComponentProps<typeof VirtuosoList>
  ) => {
    const {
      viewMode = "grid",
      density = "large",
      isHorizontal = false,
      style,
      data,
      itemWidth,
      onItemClick,
      withBookActions,
      static: isStatic,
      ...rest
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
    const adjustedRatioWhichConsiderBottom =
      theme.custom.coverAverageRatio - 0.1
    const { itemHeight, itemMargin } = useListItemHeight({
      density,
      viewMode
    })
    const computedItemWidth = itemWidth
      ? itemWidth
      : Math.floor(windowSize.width / itemsPerRow)
    const computedItemHeight =
      itemHeight ||
      Math.floor(computedItemWidth / adjustedRatioWhichConsiderBottom)

    const rowRenderer = useCallback(
      (index: number, item: string, { size }: { size: number }) => {
        const isLast = index === size - 1

        return viewMode === "grid" ? (
          <BookListGridItem
            bookId={item}
            style={{
              height: computedItemHeight,
              width: "100%"
            }}
          />
        ) : viewMode === "list" ? (
          <ItemListContainer isLast={isLast} height={itemHeight}>
            <BookListListItem
              bookId={item}
              itemHeight={(itemHeight || 0) - itemMargin}
              onItemClick={onItemClick}
              withDrawerActions={withBookActions}
              pl={1}
            />
          </ItemListContainer>
        ) : (
          <ItemListContainer isLast={isLast} borders height={itemHeight}>
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
      [
        viewMode,
        itemHeight,
        itemMargin,
        onItemClick,
        withBookActions,
        computedItemHeight
      ]
    )

    if (isStatic) {
      return (
        <Box
          style={style}
          px={isHorizontal ? 0 : 1}
          display="flex"
          flexDirection="column"
        >
          {data?.map((item, index) => (
            <Box key={item} height={itemHeight}>
              {rowRenderer(index, item, { size: data.length })}
            </Box>
          ))}
        </Box>
      )
    }

    return (
      <Stack style={style}>
        <VirtuosoList
          data={data}
          rowRenderer={rowRenderer}
          itemsPerRow={itemsPerRow}
          // layout={isHorizontal ? "horizontal" : "vertical"}
          {...rest}
        />
      </Stack>
    )

    // return (
    //   <Stack flex={1}>
    //     <VirtualizedList
    //       data={data}
    //       rowRenderer={rowRenderer}
    //       itemsPerRow={itemsPerRow}
    //       style={style}
    //       {...rest}
    //     />
    //   </Stack>
    // )
  }
)
