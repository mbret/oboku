import { memo, useCallback } from "react"
import { MoreVert } from "@mui/icons-material"
import { Box, styled, Typography, type BoxProps } from "@mui/material"
import {
  SelectableCardOverlay,
  useSelectableItemInteractions,
} from "../../common/selection"
import { useDefaultListItemClickHandler } from "./useDefaultListItemClickHandler"
import { BookCoverCard } from "../BookCoverCard"
import { bookActionDrawerSignal } from "../drawer/BookActionsDrawer"
import { getMetadataFromBook } from "../metadata"
import { useBook } from "../states"

export const BOOK_LIST_ITEM_VERTICAL_BOTTOM_HEIGHT = 50
// MUI spacing units used for `p: 1` on the outer card container.
export const BOOK_LIST_ITEM_VERTICAL_PADDING = 1

const StyledContainer = styled(Box, {
  shouldForwardProp: (prop) => prop !== "selected",
})<{ selected: boolean }>(({ theme, selected }) => ({
  display: "flex",
  flexDirection: "column",
  cursor: "pointer",
  overflow: "hidden",
  WebkitTapHighlightColor: "transparent",
  padding: theme.spacing(BOOK_LIST_ITEM_VERTICAL_PADDING),
  backgroundColor: selected
    ? theme.alpha(theme.palette.primary.main, 0.12)
    : "transparent",
  transition: theme.transitions.create("background-color", {
    duration: 150,
  }),
}))

export const BookListItemVertical = memo(function BookListItemVertical({
  bookId,
  onItemClick,
  withDrawerActions = true,
  withDownloadStatus = true,
  selectionMode = false,
  selected = false,
  onSelectionStart,
  onSelectionToggle,
  sx,
  ...rest
}: {
  bookId: string
  onItemClick?: (id: string) => void
  withDrawerActions?: boolean
  withDownloadStatus?: boolean
  selectionMode?: boolean
  selected?: boolean
  onSelectionStart?: () => void
  onSelectionToggle?: () => void
} & BoxProps) {
  const { data: book } = useBook({ id: bookId })
  const metadata = getMetadataFromBook(book)
  const onDefaultItemClick = useDefaultListItemClickHandler()

  const onCardClick = useCallback(() => {
    if (onItemClick) return onItemClick(bookId)
    return onDefaultItemClick(bookId)
  }, [bookId, onItemClick, onDefaultItemClick])

  const { itemProps, controlProps, selectionEnabled } =
    useSelectableItemInteractions({
      selectionMode,
      onSelectionStart,
      onSelectionToggle,
      onItemClick: onCardClick,
    })

  return (
    <StyledContainer
      selected={selected}
      data-book-card-container={bookId}
      sx={sx}
      {...itemProps}
      {...rest}
    >
      <SelectableCardOverlay
        selected={selected}
        selectionMode={selectionMode}
        selectionEnabled={selectionEnabled}
        controlProps={controlProps}
        itemLabel="book"
        sx={{
          flex: 1,
          display: "flex",
          // Allow this flex child to shrink below its content's intrinsic
          // height so the fixed bottom bar stays pinned. Without this, the
          // cover's intrinsic image size can push the item past its
          // container-query-derived height.
          minHeight: 0,
          overflow: "hidden",
        }}
      >
        <BookCoverCard
          bookId={bookId}
          showBottomBar
          withDownloadStatus={withDownloadStatus}
          style={{
            flex: 1,
          }}
          size="medium"
          withBadges
        />
      </SelectableCardOverlay>
      <Box
        style={{
          width: "100%",
          height: BOOK_LIST_ITEM_VERTICAL_BOTTOM_HEIGHT,
          flexFlow: "row",
          display: "flex",
          alignItems: "center",
          paddingLeft: 2,
          paddingRight: 5,
        }}
        onClick={(event) => {
          if (!withDrawerActions) {
            return
          }

          event.stopPropagation()
          book?._id && bookActionDrawerSignal.setValue({ openedWith: book._id })
        }}
      >
        <div style={{ width: "100%", overflow: "hidden" }}>
          <Typography
            variant="body2"
            style={{
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {metadata?.title || "Unknown"}
          </Typography>
          <Typography variant="caption" noWrap={true} display="block">
            {(metadata?.authors ?? [])[0] || "Unknown"}
          </Typography>
        </div>
        {withDrawerActions && (
          <MoreVert
            style={{
              transform: "translate(50%, 0%)",
            }}
          />
        )}
      </Box>
    </StyledContainer>
  )
})
