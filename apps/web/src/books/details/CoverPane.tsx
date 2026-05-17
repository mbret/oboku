import { styled } from "@mui/material"
import { Cover } from "../Cover"

const BookDetailsCover = styled(Cover)(({ theme }) => ({
  alignSelf: "center",
  width: "60%",
  maxWidth: theme.custom.maxWidthCenteredContent,
  aspectRatio: theme.custom.coverAverageRatio,
  [theme.breakpoints.up("sm")]: {
    width: 200,
  },
}))

export const CoverPane = ({ bookId }: { bookId?: string }) => {
  if (!bookId) return null

  return <BookDetailsCover bookId={bookId} blurIfNeeded={false} />
}
