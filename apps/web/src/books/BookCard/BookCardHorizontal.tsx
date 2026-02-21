import { Box, Chip, Stack, Typography, useTheme } from "@mui/material"
import { type FC, memo } from "react"
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
import { BookCoverCard } from "../BookCoverCard"
import { getMetadataFromBook } from "../metadata"
import { useBookDownloadState } from "../../download/states"

export const BookCardHorizontal: FC<{
  bookId: string
  isSelected?: (id: string) => boolean
  size?: "small" | "large"
  withDrawerActions?: boolean
  withCover?: boolean
  withAuthors?: boolean
  withDownloadIcons?: boolean
}> = memo(
  ({
    bookId,
    size = "large",
    withDrawerActions = true,
    withCover = true,
    withAuthors = true,
    withDownloadIcons = false,
  }) => {
    const { data: book } = useBook({
      id: bookId,
    })
    const theme = useTheme()
    const bookDownloadState = useBookDownloadState(bookId)
    const { data: isBookProtected } = useIsBookProtected(book)
    const metadata = getMetadataFromBook(book)

    return (
      <>
        {withCover && (
          <BookCoverCard
            bookId={bookId}
            style={{
              marginRight: theme.spacing(1),
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
      </>
    )
  },
)
