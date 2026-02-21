import { useCallback, memo, type ComponentProps, useMemo } from "react"
import { Box, useTheme } from "@mui/material"
import { useWindowSize } from "react-use"
import type { LibrarySorting } from "../../library/books/states"
import type { ListActionViewMode } from "../../common/lists/ListActionsToolbar"
import { useListItemHeight } from "./useListItemHeight"
import { VirtuosoList } from "../../common/lists/VirtuosoList"
import { BookCard } from "../BookCard/BookCard"

export const BookList = memo(
  ({
    viewMode = "grid",
    density = "large",
    style,
    data,
    itemWidth,
    onItemClick,
    withBookActions,
    static: isStatic,
    ...rest
  }: {
    viewMode?: ListActionViewMode
    sorting?: LibrarySorting
    itemWidth?: number
    density?: "dense" | "large"
    onItemClick?: (id: string) => void
    withBookActions?: boolean
    static?: boolean
  } & ComponentProps<typeof VirtuosoList>) => {
    const windowSize = useWindowSize()
    const theme = useTheme()
    const dynamicNumberOfItems = Math.round(windowSize.width / 200)
    const itemsPerRow =
      viewMode === "grid"
        ? dynamicNumberOfItems > 0
          ? dynamicNumberOfItems
          : dynamicNumberOfItems
        : 1
    const adjustedRatioWhichConsiderBottom =
      theme.custom.coverAverageRatio - 0.1
    const { itemHeight } = useListItemHeight({
      density,
      viewMode,
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

        const commonProps = {
          bookId: item,
          onItemClick,
          enableActions: withBookActions,
        }

        return viewMode === "grid" || viewMode === "horizontal" ? (
          /**
           * For vertical mode, we still want to limit the height
           */
          <BookCard
            {...commonProps}
            mode="vertical"
            style={{
              ...(viewMode === "horizontal" && {
                height: "100%",
                aspectRatio: `${adjustedRatioWhichConsiderBottom}`,
                width: "auto",
                overflow: "hidden",
              }),
              ...(viewMode !== "horizontal" && {
                height: computedItemHeight,
                width: "100%",
              }),
            }}
            p={1}
          />
        ) : viewMode === "list" ? (
          /**
           * For horizontal mode, we still want to limit the height
           */
          <BookCard
            {...commonProps}
            mode="horizontal"
            height={itemHeight || 0}
            sx={{
              pb: isLast ? 2 : 1,
            }}
          />
        ) : (
          /**
           * Compact mode leverage auto height of the BookCard.
           * Feature from virtuoso.
           */
          <BookCard
            {...commonProps}
            mode="compact"
            sx={{
              ...(!isLast && {
                borderBottom: "1px solid",
                borderColor: "grey.200",
              }),
              pb: isLast ? 2 : 1,
            }}
          />
        )
      },
      [
        adjustedRatioWhichConsiderBottom,
        viewMode,
        itemHeight,
        onItemClick,
        withBookActions,
        computedItemHeight,
      ],
    )

    const listElementStyle = useMemo(
      () => ({
        paddingLeft: viewMode === "grid" ? theme.spacing(1) : 0,
        paddingRight: viewMode === "grid" ? theme.spacing(1) : 0,
      }),
      [viewMode, theme],
    )

    if (isStatic) {
      return (
        <Box
          style={style}
          px={viewMode === "horizontal" ? 0 : 1}
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
      <VirtuosoList
        data={data}
        style={style}
        rowRenderer={rowRenderer}
        itemsPerRow={itemsPerRow}
        horizontalDirection={viewMode === "horizontal"}
        listElementStyle={listElementStyle}
        {...rest}
      />
    )
  },
)
