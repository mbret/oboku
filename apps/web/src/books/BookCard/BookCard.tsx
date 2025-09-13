import type { BoxProps } from "@mui/material"
import { BookCardHorizontal } from "./BookCardHorizontal"
import { BookCardVertical } from "./BookCardVertical"

export const BookCard = ({
  mode,
  bookId,
  enableActions = true,
  height,
  ...rest
}: {
  mode: "vertical" | "horizontal" | "compact"
  bookId: string
  enableActions?: boolean
  height?: number
  onItemClick?: (id: string) => void
} & Pick<BoxProps, "pl" | "style">) => {
  if (mode === "horizontal") {
    return (
      <BookCardHorizontal
        bookId={bookId}
        withDrawerActions={enableActions}
        itemHeight={height}
        {...rest}
      />
    )
  }

  if (mode === "compact") {
    return (
      <BookCardHorizontal
        withCover={false}
        withAuthors={false}
        withDownloadIcons
        bookId={bookId}
        itemHeight={height}
        withDrawerActions={enableActions}
        {...rest}
      />
    )
  }

  return <BookCardVertical bookId={bookId} {...rest} />
}
