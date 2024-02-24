import { Typography, useTheme } from "@mui/material"
import React, { FC } from "react"
import { useEnrichedBookState } from "../states"
import { useCSS } from "../../common/utils"
import { BookListCoverContainer } from "./BookListCoverContainer"
import { Checkbox } from "../../common/Checkbox"
import { booksDownloadStateSignal } from "../../download/states"
import { useProtectedTagIds, useTagsByIds } from "../../tags/helpers"
import { useSignalValue } from "reactjrx"

export const SelectableBookListItem: FC<{
  bookId: string
  onItemClick?: (id: string) => void
  isSelected?: (id: string) => boolean
  itemHeight: number
  withDrawerActions?: boolean
  style?: React.CSSProperties
  selected: boolean
  paddingTop?: number
  paddingBottom?: number
}> = ({
  style,
  bookId,
  onItemClick,
  itemHeight,
  selected = true,
  paddingTop = 0,
  paddingBottom = 0
}) => {
  const book = useEnrichedBookState({
    bookId,
    normalizedBookDownloadsState: useSignalValue(booksDownloadStateSignal),
    protectedTagIds: useProtectedTagIds().data,
    tags: useTagsByIds().data
  })
  const theme = useTheme()
  const computedHeight = itemHeight - paddingTop - paddingBottom
  const coverWidth = computedHeight * theme.custom.coverAverageRatio
  const classes = useStyles({ coverWidth, style, paddingTop, paddingBottom })

  return (
    <div
      onClick={() => {
        if (onItemClick) return onItemClick(bookId)
      }}
      style={classes.container}
    >
      <BookListCoverContainer
        bookId={bookId}
        style={classes.coverContainer}
        withBadges={false}
        withReadingProgressStatus={false}
        withDownloadStatus={false}
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
        <Typography noWrap variant="body1" display="block">
          {book?.title || "Unknown"}
        </Typography>
        <Typography noWrap color="textSecondary" variant="body2">
          {book?.creator || "Unknown"}
        </Typography>
      </div>
      <div style={{ alignSelf: "center" }}>
        <Checkbox selected={selected} />
      </div>
    </div>
  )
}

const useStyles = ({
  coverWidth,
  paddingTop,
  paddingBottom,
  style
}: {
  coverWidth: number
  style?: React.CSSProperties
  paddingTop?: number
  paddingBottom?: number
}) => {
  const theme = useTheme()

  return useCSS(
    () => ({
      coverContainer: {
        position: "relative",
        display: "flex",
        flex: `0 0 ${coverWidth}px`,
        minHeight: 0 // @see https://stackoverflow.com/questions/42130384/why-should-i-specify-height-0-even-if-i-specified-flex-basis-0-in-css3-flexbox
      },
      container: {
        display: "flex",
        cursor: "pointer",
        flexGrow: 1,
        overflow: "hidden",
        paddingTop,
        paddingBottom,
        height: "100%",
        ...style
      }
    }),
    [theme, coverWidth, paddingTop, paddingBottom, style]
  )
}
