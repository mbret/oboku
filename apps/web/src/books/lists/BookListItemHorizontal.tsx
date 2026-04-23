import {
  CloudDoneRounded,
  CloudDownloadRounded,
  DoneRounded,
  DownloadingRounded,
  ErrorRounded,
  LoopRounded,
  MenuBookRounded,
  MoreVert,
  NoEncryptionRounded,
  ThumbDownOutlined,
} from "@mui/icons-material"
import {
  Box,
  Checkbox,
  Chip,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  Stack,
  styled,
  Typography,
  useTheme,
  type BoxProps,
  type ListItemProps,
} from "@mui/material"
import { ReadingStateState } from "@oboku/shared"
import { memo, useCallback } from "react"
import { useBookDownloadState } from "../../download/states"
import { useLink } from "../../links/states"
import { pluginsByType } from "../../plugins/configure"
import { useSelectableItemInteractions } from "../../common/selection"
import { BookCoverCard } from "../BookCoverCard"
import { bookActionDrawerSignal } from "../drawer/BookActionsDrawer"
import { getMetadataFromBook } from "../metadata"
import { useBook, useIsBookProtected } from "../states"
import { useDefaultListItemClickHandler } from "./useDefaultListItemClickHandler"

const StyledListItem = styled(ListItem, {
  shouldForwardProp: (prop) =>
    prop !== "selectionEnabled" && prop !== "checkboxPersistentlyVisible",
})<{
  selectionEnabled: boolean
  checkboxPersistentlyVisible: boolean
}>(({ selectionEnabled, checkboxPersistentlyVisible }) => ({
  overflow: "hidden",
  ...(selectionEnabled && {
    "& .oboku-selection-checkbox": {
      display: checkboxPersistentlyVisible ? "inline-flex" : "none",
    },
    "@media (hover: hover)": {
      "&:hover .oboku-selection-checkbox": {
        display: "inline-flex",
      },
    },
  }),
}))

const StyledListItemButton = styled(ListItemButton, {
  shouldForwardProp: (prop) => prop !== "isCompact",
})<{ isCompact: boolean }>(({ theme, isCompact }) => ({
  alignItems: isCompact ? "center" : "stretch",
  gap: theme.spacing(1),
  height: "100%",
  minHeight: 0,
  overflow: "hidden",
  ...(isCompact && {
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1),
  }),
}))

function BookMetadataStatus({
  bookId,
  withDownloadIcons = false,
  ...rest
}: {
  bookId: string
  withDownloadIcons?: boolean
} & BoxProps) {
  const { data: book } = useBook({
    id: bookId,
  })
  const { data: link } = useLink({ id: book?.links?.[0] })
  const linkPlugin = link?.type ? pluginsByType[link?.type] : undefined
  const bookDownloadState = useBookDownloadState(bookId)
  const { data: isBookProtected } = useIsBookProtected(book)

  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="flex-end"
      width="100%"
      gap={1}
      {...rest}
    >
      <Box display="flex" flexDirection="row" alignItems="center" gap={1}>
        {linkPlugin?.Icon && (
          <linkPlugin.Icon fontSize="small" sx={{ display: "block" }} />
        )}
        {withDownloadIcons &&
          (bookDownloadState?.isDownloading ? (
            <DownloadingRounded color="action" />
          ) : bookDownloadState?.isDownloaded ? (
            <CloudDoneRounded color="action" />
          ) : (
            <CloudDownloadRounded color="action" />
          ))}
        {isBookProtected && <NoEncryptionRounded color="action" />}
        {book?.isNotInterested && <ThumbDownOutlined color="action" />}
        {book?.readingStateCurrentState === ReadingStateState.Finished && (
          <DoneRounded color="action" />
        )}
        {book?.readingStateCurrentState === ReadingStateState.Reading && (
          <Box display="flex" flexDirection="row" alignItems="center" gap={0.5}>
            <MenuBookRounded color="action" />
            <Typography variant="body2">
              {Math.floor(
                (book?.readingStateCurrentBookmarkProgressPercent || 0) * 100,
              ) || 1}
              %
            </Typography>
          </Box>
        )}
      </Box>
      <Box display="flex" flexDirection="row" alignItems="center">
        {book?.metadataUpdateStatus === "fetching" && (
          <Chip
            size="small"
            avatar={<LoopRounded className="oboku-infinite-spin" />}
            label="metadata..."
          />
        )}
        {book?.metadataUpdateStatus !== "fetching" &&
          !!book?.lastMetadataUpdateError && (
            <Chip
              size="small"
              icon={<ErrorRounded color="primary" />}
              color="primary"
              label="metadata"
            />
          )}
      </Box>
    </Box>
  )
}

export const BookListItemHorizontal = memo(function BookListItem({
  bookId,
  variant = "default",
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
  variant?: "default" | "compact"
  onItemClick?: (id: string) => void
  withDrawerActions?: boolean
  withDownloadStatus?: boolean
  selectionMode?: boolean
  selected?: boolean
  onSelectionStart?: () => void
  onSelectionToggle?: () => void
} & ListItemProps) {
  const theme = useTheme()
  const { data: book } = useBook({
    id: bookId,
  })
  const onDefaultItemClick = useDefaultListItemClickHandler()
  const metadata = getMetadataFromBook(book)
  const isCompact = variant === "compact"
  const isCheckboxPersistentlyVisible = selectionMode || selected

  const handleItemClick = useCallback(() => {
    if (onItemClick) {
      onItemClick(bookId)
      return
    }

    onDefaultItemClick(bookId)
  }, [bookId, onItemClick, onDefaultItemClick])

  const { itemProps, controlProps, selectionEnabled } =
    useSelectableItemInteractions({
      selectionMode,
      onSelectionStart,
      onSelectionToggle,
      onItemClick: handleItemClick,
    })

  return (
    <StyledListItem
      component="div"
      role="listitem"
      disablePadding
      selectionEnabled={selectionEnabled}
      checkboxPersistentlyVisible={isCheckboxPersistentlyVisible}
      secondaryAction={
        withDrawerActions ? (
          <IconButton
            edge="end"
            size="large"
            onClick={(event) => {
              event.stopPropagation()
              book?._id &&
                bookActionDrawerSignal.setValue({ openedWith: book._id })
            }}
            sx={{
              alignSelf: isCompact ? "center" : "flex-end",
            }}
          >
            <MoreVert />
          </IconButton>
        ) : undefined
      }
      sx={sx}
      {...rest}
    >
      <StyledListItemButton
        isCompact={isCompact}
        dense={isCompact}
        selected={selected}
        {...itemProps}
      >
        {selectionEnabled && (
          <ListItemIcon
            className="oboku-selection-checkbox"
            sx={{
              alignSelf: "center",
              minWidth: "auto",
            }}
          >
            <Checkbox
              checked={selected}
              color="primary"
              disableRipple
              edge="start"
              inputProps={{
                "aria-label": selected
                  ? "Unselect this book"
                  : "Select this book",
              }}
              tabIndex={-1}
              {...controlProps}
            />
          </ListItemIcon>
        )}
        {!isCompact && (
          <Box
            display="flex"
            flex="none"
            alignSelf="stretch"
            mr={1}
            overflow="hidden"
            sx={{ aspectRatio: theme.custom.coverAverageRatio }}
          >
            <BookCoverCard
              bookId={bookId}
              withBadges={false}
              withDownloadStatus={withDownloadStatus}
            />
          </Box>
        )}
        <Stack flex={1} minHeight={0} overflow="hidden" gap={0.5}>
          <Typography
            noWrap
            variant={isCompact ? "body2" : "body1"}
            display="block"
          >
            {metadata?.title || "Unknown"}
          </Typography>
          {!isCompact && (
            <Typography noWrap color="textSecondary" variant="body2">
              {(metadata?.authors ?? [])[0] || "Unknown"}
            </Typography>
          )}
          <BookMetadataStatus
            bookId={bookId}
            withDownloadIcons={isCompact}
            mt="auto"
          />
        </Stack>
      </StyledListItemButton>
    </StyledListItem>
  )
})
