import type React from "react"
import { type FC, memo } from "react"
import { Box, type BoxProps, Chip } from "@mui/material"
import {
  CheckOutlined,
  CloudDownloadRounded,
  ErrorRounded,
  LoopRounded,
  NoEncryptionOutlined,
  ThumbDownOutlined,
} from "@mui/icons-material"
import { Cover } from "../Cover"
import { useBook, useIsBookProtected } from "../states"
import { ReadingStateState } from "@oboku/shared"
import { ReadingProgress } from "./ReadingProgress"
import { DownloadState, useBookDownloadState } from "../../download/states"
import { CoverIconBadge } from "./CoverIconBadge"

export const BookListCoverContainer: FC<
  {
    bookId: string
    className?: string
    style?: React.CSSProperties
    withReadingProgressStatus?: boolean
    withDownloadStatus?: boolean
    withBadges: boolean
    size?: "small" | "large" | "medium"
  } & BoxProps
> = memo(
  ({
    bookId,
    className,
    style,
    withDownloadStatus = true,
    withReadingProgressStatus = true,
    withBadges,
    size = "small",
    ...rest
  }) => {
    const { data: item } = useBook({ id: bookId })
    const bookDownloadState = useBookDownloadState(bookId)
    const { data: isBookProtected } = useIsBookProtected(item)

    return (
      <Box
        sx={{
          position: "relative",
          display: "flex",
          minHeight: 0, // @see https://stackoverflow.com/questions/42130384/why-should-i-specify-height-0-even-if-i-specified-flex-basis-0-in-css3-flexbox
        }}
        style={style}
        className={className}
        {...rest}
      >
        {item && <Cover bookId={item?._id} />}
        {bookDownloadState?.downloadState !== DownloadState.Downloaded && (
          <Box
            bgcolor="white"
            top={0}
            position="absolute"
            width="100%"
            style={{
              opacity: 0.5,
              height:
                bookDownloadState?.downloadState === DownloadState.Downloading
                  ? `${100 - (bookDownloadState?.downloadProgress || 0)}%`
                  : `100%`,
            }}
          />
        )}
        <Box
          sx={{
            position: "absolute",
            height: "100%",
            width: "100%",
            top: 0,
            display: "flex",
            padding: (theme) => theme.spacing(0.5),
            flexDirection: "column",
            alignItems: "center",
          }}
          gap={1}
        >
          {withBadges && (
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              flexDirection="row"
              width="100%"
            >
              <Box gap={1} flexDirection="row" display="flex">
                {isBookProtected && (
                  <CoverIconBadge>
                    <NoEncryptionOutlined fontSize={size} />
                  </CoverIconBadge>
                )}
                {item?.isNotInterested && (
                  <CoverIconBadge>
                    <ThumbDownOutlined fontSize={size} />
                  </CoverIconBadge>
                )}
              </Box>
              {withReadingProgressStatus &&
                item?.readingStateCurrentState ===
                  ReadingStateState.Finished && (
                  <CoverIconBadge alignSelf="flex-end" justifySelf="flex-end">
                    <CheckOutlined fontSize={size} />
                  </CoverIconBadge>
                )}
            </Box>
          )}
          {withBadges && item?.metadataUpdateStatus === "fetching" && (
            <Chip
              color="primary"
              size="small"
              icon={
                <LoopRounded color="primary" className="oboku-infinite-spin" />
              }
              label="metadata..."
            />
          )}
          {withBadges &&
            item?.metadataUpdateStatus !== "fetching" &&
            !!item?.lastMetadataUpdateError && (
              <Chip
                color="primary"
                size="small"
                icon={<ErrorRounded color="primary" />}
                label="metadata"
              />
            )}
          {withDownloadStatus &&
            bookDownloadState?.downloadState === DownloadState.None && (
              <CoverIconBadge
                position="absolute"
                left="50%"
                top="50%"
                style={{
                  transform: "translate(-50%, -50%)",
                }}
              >
                <CloudDownloadRounded color="action" fontSize={size} />
              </CoverIconBadge>
            )}
          {withDownloadStatus &&
            bookDownloadState?.downloadState === DownloadState.Downloading && (
              <Box
                sx={{
                  transform: "translate(-50%, -50%)",
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                }}
              >
                <Chip color="primary" size="small" label="downloading..." />
              </Box>
            )}
        </Box>
        {withReadingProgressStatus &&
          item?.readingStateCurrentState === ReadingStateState.Reading && (
            <ReadingProgress
              progress={
                (item?.readingStateCurrentBookmarkProgressPercent || 0) * 100
              }
              style={{
                position: "absolute",
                bottom: 0,
                left: "50%",
                transform: "translateX(-50%)",
              }}
            />
          )}
      </Box>
    )
  },
)
