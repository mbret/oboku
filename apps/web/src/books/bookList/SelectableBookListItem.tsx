import { Box, Typography, useTheme } from "@mui/material"
import type React from "react"
import { memo } from "react"
import { useBook } from "../states"
import { BookCoverCard } from "../BookCoverCard"
import { Checkbox } from "../../common/Checkbox"
import { getMetadataFromBook } from "../metadata"

export const SelectableBookListItem = memo(
  ({
    style,
    bookId,
    onItemClick,
    itemHeight,
    selected = true,
    padding = 1,
  }: {
    bookId: string
    onItemClick?: (id: string) => void
    isSelected?: (id: string) => boolean
    itemHeight: number
    withDrawerActions?: boolean
    style?: React.CSSProperties
    selected: boolean
    padding?: number
  }) => {
    const { data: book } = useBook({ id: bookId })
    const theme = useTheme()
    const computedHeight = itemHeight
    const coverWidth = `calc((${computedHeight}px - ${theme.spacing(padding / 2)} * 2) *
        ${theme.custom.coverAverageRatio})`
    const metadata = getMetadataFromBook(book)

    return (
      <Box
        onClick={() => {
          if (onItemClick) return onItemClick(bookId)
        }}
        style={{
          display: "flex",
          cursor: "pointer",
          flexGrow: 1,
          overflow: "hidden",
          height: itemHeight,
          ...style,
        }}
        px={padding}
        py={padding / 2}
      >
        <BookCoverCard
          bookId={bookId}
          style={{
            position: "relative",
            display: "flex",
            flex: `0 0 ${coverWidth}`,
            minHeight: 0, // @see https://stackoverflow.com/questions/42130384/why-should-i-specify-height-0-even-if-i-specified-flex-basis-0-in-css3-flexbox
          }}
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
            overflow: "hidden",
          }}
        >
          <Typography noWrap variant="body1" display="block">
            {metadata?.title || "Unknown"}
          </Typography>
          <Typography noWrap color="textSecondary" variant="body2">
            {(metadata?.authors ?? [])[0] || "Unknown"}
          </Typography>
        </div>
        <div style={{ alignSelf: "center" }}>
          <Checkbox selected={selected} />
        </div>
      </Box>
    )
  },
)
