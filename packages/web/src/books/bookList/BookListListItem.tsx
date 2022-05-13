import { Chip, Typography, useTheme } from "@mui/material"
import React, { FC } from "react"
import { useRecoilValue, useSetRecoilState } from "recoil"
import { useDefaultItemClickHandler } from "./helpers"
import { enrichedBookState } from "../states"
import { ReadingStateState } from "@oboku/shared"
import {
  DoneRounded,
  ErrorRounded,
  LoopRounded,
  MenuBookRounded,
  MoreVert
} from "@mui/icons-material"
import { bookActionDrawerState } from "../BookActionsDrawer"
import { useCSS } from "../../common/utils"
import { BookListCoverContainer } from "./BookListCoverContainer"

export const BookListListItem: FC<{
  bookId: string
  onItemClick?: (id: string) => void
  isSelected?: (id: string) => boolean
  size?: "small" | "large"
  itemHeight?: number
  withDrawerActions?: boolean
}> = ({
  bookId,
  onItemClick,
  size = "large",
  itemHeight,
  withDrawerActions = true
}) => {
  const book = useRecoilValue(enrichedBookState(bookId))
  const onDefaultItemClick = useDefaultItemClickHandler()
  const theme = useTheme()
  const computedHeight = itemHeight || (size === "small" ? 50 : 100)
  const coverWidth = computedHeight * theme.custom.coverAverageRatio
  const classes = useStyles({ coverWidth })
  const setBookActionDrawerState = useSetRecoilState(bookActionDrawerState)

  return (
    <div
      onClick={() => {
        if (onItemClick) return onItemClick(bookId)
        return onDefaultItemClick(bookId)
      }}
      style={{
        display: "flex",
        overflow: "hidden",
        height: computedHeight,
        // height: '100%',
        cursor: "pointer",
        flexGrow: 1
      }}
    >
      <BookListCoverContainer
        bookId={bookId}
        style={classes.coverContainer}
        withReadingProgressStatus={false}
        withDownloadStatus={false}
        withMetadaStatus={false}
        withProtectedStatus={false}
      />
      <div
        style={{
          display: "flex",
          flex: 1,
          minHeight: 0,
          flexDirection: "column",
          marginLeft: theme.spacing(1),
          overflow: "hidden"
        }}
      >
        <Typography
          noWrap
          variant="body1"
          display="block"
          {...(size === "small" && {
            variant: "body2"
          })}
        >
          {book?.title || "Unknown"}
        </Typography>
        <Typography noWrap color="textSecondary" variant="body2">
          {book?.creator || "Unknown"}
        </Typography>
        {/* <div style={{ display: 'flex', flex: 1, alignItems: 'flex-end', justifyContent: 'space-between' }}>
          {book?.isProtected && (
            <NoEncryptionRounded color="secondary" />
          )}
        </div> */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            flex: 1,
            alignItems: "flex-end"
          }}
        >
          <div>
            {book?.readingStateCurrentState === ReadingStateState.Finished && (
              <div style={{ display: "flex", flexDirection: "row" }}>
                <DoneRounded color="secondary" style={{}} />
              </div>
            )}
            {book?.readingStateCurrentState === ReadingStateState.Reading && (
              <div style={{ display: "flex", flexDirection: "row" }}>
                <MenuBookRounded style={{ opacity: "50%" }} />
                <Typography
                  color="textSecondary"
                  style={{
                    marginLeft: theme.spacing(0.5)
                  }}
                >
                  {Math.floor(
                    (book?.readingStateCurrentBookmarkProgressPercent || 0) *
                      100
                  ) || 1}
                  %
                </Typography>
              </div>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "row" }}>
            {/* {(book?.downloadState === DownloadState.Downloading) && (
              <div style={{ display: 'flex', flexDirection: 'row' }}>
                <Chip size="small" label="downloading..." />
              </div>
            )} */}
            {book?.metadataUpdateStatus === "fetching" && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  marginLeft: theme.spacing(1)
                }}
              >
                <Chip
                  size="small"
                  avatar={<LoopRounded className="icon-spin" />}
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
                    marginLeft: theme.spacing(1)
                  }}
                >
                  <Chip
                    size="small"
                    icon={<ErrorRounded color="primary" />}
                    label="metadata"
                  />
                </div>
              )}
          </div>
        </div>
      </div>
      {withDrawerActions && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            marginLeft: theme.spacing(1)
          }}
          onClick={(e) => {
            e.stopPropagation()
            book?._id && setBookActionDrawerState({ openedWith: book._id })
          }}
        >
          <MoreVert />
        </div>
      )}
    </div>
  )
}

const useStyles = ({ coverWidth }: { coverWidth: number }) => {
  const theme = useTheme()

  return useCSS(
    () => ({
      coverContainer: {
        position: "relative",
        display: "flex",
        flex: `0 0 ${coverWidth}px`,
        minHeight: 0 // @see https://stackoverflow.com/questions/42130384/why-should-i-specify-height-0-even-if-i-specified-flex-basis-0-in-css3-flexbox
      }
    }),
    [theme, coverWidth]
  )
}
