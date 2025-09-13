import {
  Box,
  type BoxProps,
  Chip,
  Stack,
  Typography,
  useTheme,
} from "@mui/material"
import { type FC, memo } from "react"
import { useDefaultItemClickHandler } from "../bookList/helpers"
import { useBook, useIsBookProtected } from "../states"
import { ReadingStateState } from "@oboku/shared"
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
import { bookActionDrawerSignal } from "../drawer/BookActionsDrawer"
import { BookListCoverContainer } from "../bookList/BookListCoverContainer"
import { getMetadataFromBook } from "../metadata"
import { useBookDownloadState } from "../../download/states"

export const BookCardHorizontal: FC<
  {
    bookId: string
    onItemClick?: (id: string) => void
    isSelected?: (id: string) => boolean
    size?: "small" | "large"
    itemHeight?: number
    withDrawerActions?: boolean
    withCover?: boolean
    withAuthors?: boolean
    withDownloadIcons?: boolean
  } & BoxProps
> = memo(
  ({
    bookId,
    onItemClick,
    size = "large",
    itemHeight,
    withDrawerActions = true,
    withCover = true,
    withAuthors = true,
    withDownloadIcons = false,
    ...rest
  }) => {
    const { data: book } = useBook({
      id: bookId,
    })
    const onDefaultItemClick = useDefaultItemClickHandler()
    const theme = useTheme()
    const computedHeight = itemHeight || (size === "small" ? 50 : 100)
    const coverWidth = computedHeight * theme.custom.coverAverageRatio
    const bookDownloadState = useBookDownloadState(bookId)
    const { data: isBookProtected } = useIsBookProtected(book)

    const metadata = getMetadataFromBook(book)

    return (
      <Box
        onClick={() => {
          if (onItemClick) return onItemClick(bookId)
          return onDefaultItemClick(bookId)
        }}
        style={{
          display: "flex",
          overflow: "hidden",
          height: computedHeight,
          cursor: "pointer",
          flexGrow: 1,
        }}
        {...rest}
      >
        {withCover && (
          <BookListCoverContainer
            bookId={bookId}
            style={{
              position: "relative",
              marginRight: theme.spacing(1),
              display: "flex",
              flex: `0 0 ${coverWidth}px`,
              minHeight: 0, // @see https://stackoverflow.com/questions/42130384/why-should-i-specify-height-0-even-if-i-specified-flex-basis-0-in-css3-flexbox
            }}
            withBadges={false}
            withReadingProgressStatus={false}
          />
        )}
        <Stack
          style={{
            flex: 1,
            minHeight: 0,
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <Typography
            noWrap
            variant="body1"
            display="block"
            {...(size === "small" && {
              variant: "body2",
            })}
          >
            {metadata?.title || "Unknown"}
          </Typography>
          {withAuthors && (
            <Typography noWrap color="textSecondary" variant="body2">
              {(metadata?.authors ?? [])[0] || "Unknown"}
            </Typography>
          )}
          <Box
            style={{
              display: "flex",
              justifyContent: "space-between",
              flex: 1,
              alignItems: "flex-end",
            }}
          >
            <Box display="flex" flexDirection="row" gap={1}>
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
              {book?.readingStateCurrentState ===
                ReadingStateState.Finished && (
                <div style={{ display: "flex", flexDirection: "row" }}>
                  <DoneRounded style={{}} color="action" />
                </div>
              )}
              {book?.readingStateCurrentState === ReadingStateState.Reading && (
                <div style={{ display: "flex", flexDirection: "row" }}>
                  <MenuBookRounded color="action" />
                  <Typography
                    style={{
                      marginLeft: theme.spacing(0.5),
                    }}
                  >
                    {Math.floor(
                      (book?.readingStateCurrentBookmarkProgressPercent || 0) *
                        100,
                    ) || 1}
                    %
                  </Typography>
                </div>
              )}
            </Box>
            <div style={{ display: "flex", flexDirection: "row" }}>
              {book?.metadataUpdateStatus === "fetching" && (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "row",
                    marginLeft: theme.spacing(1),
                  }}
                >
                  <Chip
                    size="small"
                    avatar={<LoopRounded className="oboku-infinite-spin" />}
                    label="metadata..."
                  />
                </div>
              )}
              {book?.metadataUpdateStatus !== "fetching" &&
                !!book?.lastMetadataUpdateError && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "row",
                      marginLeft: theme.spacing(1),
                    }}
                  >
                    <Chip
                      size="small"
                      icon={<ErrorRounded color="primary" />}
                      color="primary"
                      label="metadata"
                    />
                  </div>
                )}
            </div>
          </Box>
        </Stack>
        {withDrawerActions && (
          <Stack
            justifyContent="center"
            width={[40, 50]}
            flexDirection="row"
            style={{
              alignItems: "center",
              marginLeft: theme.spacing(1),
            }}
            onClick={(e) => {
              e.stopPropagation()
              book?._id &&
                bookActionDrawerSignal.setValue({ openedWith: book._id })
            }}
          >
            <MoreVert />
          </Stack>
        )}
      </Box>
    )
  },
)
