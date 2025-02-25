import { type ComponentProps, type FC, memo } from "react"
import { Box, Typography, styled } from "@mui/material"
import { MoreVert } from "@mui/icons-material"
import { bookActionDrawerSignal } from "../drawer/BookActionsDrawer"
import { useBook } from "../states"
import { useDefaultItemClickHandler } from "./helpers"
import { BookListCoverContainer } from "./BookListCoverContainer"
import { getMetadataFromBook } from "../metadata"

const ContainerBox = styled(Box)`
  cursor: pointer;
  position: relative;
  display: flex;
  flex-direction: column;
  padding: ${({ theme }) => theme.spacing(1)};
  -webkit-tap-highlight-color: transparent;
`

export const BookListGridItem: FC<
  {
    bookId: string
    onItemClick?: (id: string) => void
  } & ComponentProps<typeof ContainerBox>
> = memo(({ bookId, onItemClick, ...rest }) => {
  const { data: item } = useBook({
    id: bookId,
  })
  const onDefaultItemClick = useDefaultItemClickHandler()

  const metadata = getMetadataFromBook(item)

  return (
    <ContainerBox
      key={item?._id}
      onClick={() => {
        if (onItemClick) return onItemClick(bookId)
        return onDefaultItemClick(bookId)
      }}
      {...rest}
    >
      <BookListCoverContainer
        bookId={bookId}
        style={{
          position: "relative",
          display: "flex",
          flex: 1,
          // marginTop: theme.spacing(1),
          minHeight: 0, // @see https://stackoverflow.com/questions/42130384/why-should-i-specify-height-0-even-if-i-specified-flex-basis-0-in-css3-flexbox
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
    </ContainerBox>
  )
})
