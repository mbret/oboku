import React, { FC, memo } from "react"
import { Box, Chip, useTheme } from "@mui/material"
import {
  CheckCircleRounded,
  CloudDownloadRounded,
  ErrorRounded,
  LoopRounded,
  NoEncryptionRounded,
  ThumbDownOutlined
} from "@mui/icons-material"
import { Cover } from "../Cover"
import { useBook, useIsBookProtected } from "../states"
import { ReadingStateState } from "@oboku/shared"
import { ReadingProgress } from "./ReadingProgress"
import {
  DownloadState,
  booksDownloadStateSignal,
  useBookDownloadState
} from "../../download/states"
import { useCSS } from "../../common/utils"
import { useSignalValue } from "reactjrx"

type Book = ReturnType<typeof useBook>["data"]

export const BookListCoverContainer: FC<{
  bookId: string
  className?: string
  style?: React.CSSProperties
  withReadingProgressStatus?: boolean
  withDownloadStatus?: boolean
  withMetadaStatus?: boolean
  withProtectedStatus?: boolean
  size?: "small" | "large"
}> = memo(
  ({
    bookId,
    className,
    withMetadaStatus = true,
    style,
    withDownloadStatus = true,
    withReadingProgressStatus = true,
    size = "small",
    withProtectedStatus = true
  }) => {
    const { data: item } = useBook({ id: bookId })
    const bookDownloadState = useBookDownloadState(bookId)
    const { data: isBookProtected = true } = useIsBookProtected(item)
    const classes = useStyles({ item })

    return (
      <Box
        style={{ ...classes.coverContainer, ...style }}
        className={className}
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
                  : `100%`
            }}
          />
        )}
        {withProtectedStatus && isBookProtected && (
          <div style={classes.protectedIconContainer}>
            <NoEncryptionRounded
              style={classes.protectedIcon}
              fontSize="small"
            />
          </div>
        )}
        {withReadingProgressStatus &&
          item?.readingStateCurrentState === ReadingStateState.Finished && (
            <div style={classes.finishIconContainer}>
              <CheckCircleRounded style={classes.finishIcon} fontSize={size} />
            </div>
          )}
        <Box style={classes.bodyContainer}>
          {item?.isNotInterested && (
            <ThumbDownOutlined
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                transform: "translate(-20%, 20%)"
              }}
              color="action"
              fontSize={size}
            />
          )}
          {withMetadaStatus && item?.metadataUpdateStatus === "fetching" && (
            <div style={classes.itemCoverCenterInfo}>
              <Chip
                color="primary"
                size="small"
                icon={<LoopRounded color="primary" className="icon-spin" />}
                label="metadata..."
              />
            </div>
          )}
          {withMetadaStatus &&
            item?.metadataUpdateStatus !== "fetching" &&
            !!item?.lastMetadataUpdateError && (
              <div style={classes.itemCoverCenterInfo}>
                <Chip
                  color="primary"
                  size="small"
                  icon={<ErrorRounded color="primary" />}
                  label="metadata"
                />
              </div>
            )}
          {bookDownloadState?.downloadState === DownloadState.None && (
            <Box
              position="absolute"
              left="50%"
              top="50%"
              style={{
                transform: "translate(-50%, -50%)"
              }}
            >
              <CloudDownloadRounded color="action" fontSize={size} />
            </Box>
          )}
          {withDownloadStatus &&
            bookDownloadState?.downloadState === DownloadState.Downloading && (
              <div style={classes.pauseButton}>
                <Chip color="primary" size="small" label="downloading..." />
              </div>
            )}
        </Box>
        {withReadingProgressStatus && (
          <>
            {item?.readingStateCurrentState === ReadingStateState.Reading && (
              <ReadingProgress
                progress={
                  (item?.readingStateCurrentBookmarkProgressPercent || 0) * 100
                }
                style={classes.readingProgress}
              />
            )}
          </>
        )}
      </Box>
    )
  }
)

const useStyles = ({ item }: { item: Book }) => {
  const theme = useTheme()

  return useCSS(
    () => ({
      coverContainer: {
        position: "relative",
        display: "flex",
        minHeight: 0 // @see https://stackoverflow.com/questions/42130384/why-should-i-specify-height-0-even-if-i-specified-flex-basis-0-in-css3-flexbox
      },
      itemCoverCenterInfo: {
        display: "flex",
        overflow: "hidden"
      },
      itemCoverCenterInfoText: {},
      finishIconContainer: { position: "absolute", right: 5, top: 5 },
      finishIcon: { opacity: "70%", color: "black" },
      protectedIconContainer: {
        position: "absolute",
        left: 5,
        top: 5,
        backgroundColor: "black",
        borderRadius: 50,
        padding: 4,
        opacity: "70%"
      },
      protectedIcon: { opacity: "100%", color: "white" },
      bodyContainer: {
        position: "absolute",
        height: "100%",
        width: "100%",
        top: 0,
        display: "flex",
        padding: theme.spacing(1),
        flexDirection: "column",
        alignItems: "center"
      },
      readingProgress: {
        position: "absolute",
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)"
      },
      pauseButton: {
        transform: "translate(-50%, -50%)",
        position: "absolute",
        left: "50%",
        top: "50%"
      }
    }),
    [theme, item]
  )
}
