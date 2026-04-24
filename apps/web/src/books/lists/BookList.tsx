import { memo, type ComponentProps, useCallback, useMemo } from "react"
import { Box, useTheme } from "@mui/material"
import { useWindowSize } from "react-use"
import type { LibrarySorting } from "../../library/books/states"
import type { ListActionViewMode } from "../../common/lists/ListActionsToolbar"
import { useListItemHeight } from "./useListItemHeight"
import { VirtuosoList } from "../../common/lists/VirtuosoList"
import { BookListItemHorizontal } from "./BookListItemHorizontal"
import {
  BOOK_LIST_ITEM_VERTICAL_BOTTOM_HEIGHT,
  BOOK_LIST_ITEM_VERTICAL_PADDING,
  BookListItemVertical,
} from "./BookListItemVertical"

export const BookList = memo(function BookList({
  viewMode = "grid",
  density = "large",
  style,
  data,
  onItemClick,
  withDrawerActions,
  selectionMode = false,
  selected,
  onSelectionStart,
  onSelectionToggle,
  static: isStatic,
  ...rest
}: {
  viewMode?: ListActionViewMode
  sorting?: LibrarySorting
  density?: "dense" | "large"
  onItemClick?: (id: string) => void
  withDrawerActions?: boolean
  selectionMode?: boolean
  selected?: Partial<Record<string, boolean>>
  onSelectionStart?: (id: string) => void
  onSelectionToggle?: (id: string) => void
  static?: boolean
} & ComponentProps<typeof VirtuosoList>) {
  const windowSize = useWindowSize()
  const theme = useTheme()
  const dynamicNumberOfItems = Math.max(1, Math.round(windowSize.width / 200))
  const itemsPerRow = viewMode === "grid" ? dynamicNumberOfItems : 1
  const { itemHeight } = useListItemHeight({
    density,
    viewMode,
  })
  // Cover ratio invariant: cover_width / cover_height = coverRatio
  // The outer item adds pixel chrome: 2× padding + bottom bar.
  // Derivation:
  //   outer_height = (outer_width - 2p) / r + B + 2p
  //   outer_width  = (outer_height - B - 2p) × r + 2p
  //
  // Both modes use container queries on an ancestor that has a known dimension:
  // - Grid:      per-cell container exposes `cqi` (cell width)  → derive height
  // - Carousel:  outer list container exposes `cqb` (list height) → derive width
  const coverRatio = theme.custom.coverAverageRatio
  const paddingCss = theme.spacing(BOOK_LIST_ITEM_VERTICAL_PADDING)
  const chromeHeightCss = `calc(${paddingCss} * 2 + ${BOOK_LIST_ITEM_VERTICAL_BOTTOM_HEIGHT}px)`
  const chromeWidthCss = `calc(${paddingCss} * 2)`
  const gridItemHeightCss = `calc((100cqi - ${chromeWidthCss}) / ${coverRatio} + ${chromeHeightCss})`
  const carouselItemWidthCss = `calc((100cqb - ${chromeHeightCss}) * ${coverRatio} + ${chromeWidthCss})`

  const rowRenderer = useCallback(
    (index: number, item: string, { size }: { size: number }) => {
      const isLast = index === size - 1
      const commonItemProps = {
        bookId: item,
        onItemClick,
        withDrawerActions: selectionMode ? false : withDrawerActions,
        withDownloadStatus: !selectionMode,
        selected: !!selected?.[item],
        selectionMode,
        onSelectionStart: onSelectionStart
          ? () => onSelectionStart(item)
          : undefined,
        onSelectionToggle: onSelectionToggle
          ? () => onSelectionToggle(item)
          : undefined,
      }

      return viewMode === "grid" || viewMode === "horizontal" ? (
        /**
         * Grid mode: this wrapper is the `inline-size` container the inner
         * card resolves `100cqi` against, so its width MUST be well-defined.
         * It inherits width from Virtuoso's `GridItem` cell
         * (`width: ${100 / itemsPerRow}%` in VirtuosoList). When
         * `itemsPerRow` changes, that `GridItem` is recreated via
         * `useMemo([itemsPerRow])`, which causes VirtuosoGrid to remount
         * cells and re-measure item heights — keeping Virtuoso's cached
         * measurements in sync with the container-query-driven height.
         * If VirtuosoList stops recreating `GridItem` on `itemsPerRow`
         * changes (or the virtualizer is swapped), cells may retain stale
         * heights and this wrapper will need an explicit remount strategy
         * (e.g. `key={itemsPerRow}`).
         *
         * Horizontal (carousel) mode: height comes from the parent; the
         * card's width is derived from `100cqb` against the scroller
         * viewport, which is made a size container by VirtuosoList's
         * `.horizontalCarousel` class.
         */
        <Box
          sx={
            viewMode === "grid"
              ? { containerType: "inline-size", width: "100%" }
              : { height: "100%" }
          }
        >
          <BookListItemVertical
            {...commonItemProps}
            style={
              viewMode === "horizontal"
                ? { width: carouselItemWidthCss, height: "100%" }
                : { width: "100%", height: gridItemHeightCss }
            }
          />
        </Box>
      ) : (
        /**
         * `list` uses a fixed height from the density preset.
         * `compact` (default) leverages virtuoso's auto-height and draws
         * dividers between rows.
         */
        <BookListItemHorizontal
          {...commonItemProps}
          variant={viewMode === "list" ? "default" : "compact"}
          sx={
            viewMode === "list"
              ? { height: itemHeight || 0 }
              : {
                  width: "100%",
                  borderBottom: isLast ? 0 : 1,
                  borderColor: "grey.200",
                }
          }
        />
      )
    },
    [
      viewMode,
      onItemClick,
      withDrawerActions,
      selectionMode,
      selected,
      onSelectionStart,
      onSelectionToggle,
      carouselItemWidthCss,
      gridItemHeightCss,
      itemHeight,
    ],
  )

  /**
   * NOTE: never set `paddingLeft`/`paddingRight` here for horizontal mode.
   * Virtuoso uses the list element's inline paddings to represent the virtual
   * extent of unrendered items on either side of the rendered window; zeroing
   * them caps the scrollable width to only the rendered items, which makes
   * scroll stop before the rest of the items can be reached.
   */
  const listElementStyle = useMemo(
    () =>
      viewMode === "grid"
        ? {
            paddingLeft: theme.spacing(1),
            paddingRight: theme.spacing(1),
          }
        : undefined,
    [theme, viewMode],
  )

  if (isStatic) {
    return (
      <Box
        style={style}
        sx={{
          px: viewMode === "horizontal" ? 0 : 1,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {data?.map((item, index) => (
          <Box
            key={item}
            sx={{
              height: itemHeight,
            }}
          >
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
})
