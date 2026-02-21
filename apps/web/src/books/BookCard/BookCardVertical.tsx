import { memo } from "react"
import { Box, Typography } from "@mui/material"
import { MoreVert } from "@mui/icons-material"
import { bookActionDrawerSignal } from "../drawer/BookActionsDrawer"
import { useBook } from "../states"
import { BookCoverCard } from "../BookCoverCard"
import { getMetadataFromBook } from "../metadata"

export const BookCardVertical = memo(({ bookId }: { bookId: string }) => {
  const { data: item } = useBook({
    id: bookId,
  })
  const metadata = getMetadataFromBook(item)

  return (
    <>
      <BookCoverCard
        bookId={bookId}
        style={{
          // overwrite aspect ratio and force to take all the available space
          // aspect ratio is set to the broader card.
          flex: 1,
        }}
        size="medium"
        withBadges
      />
      <Box
        style={{
          width: "100%",
          height: 50,
          flexFlow: "row",
          display: "flex",
          alignItems: "center",
          paddingLeft: 2,
          paddingRight: 5,
          // marginBottom: theme.spacing(1),
        }}
        onClick={(e) => {
          e.stopPropagation()
          item?._id && bookActionDrawerSignal.setValue({ openedWith: item._id })
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
        <MoreVert
          style={{
            transform: "translate(50%, 0%)",
          }}
        />
      </Box>
    </>
  )
})
