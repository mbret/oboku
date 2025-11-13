import { Box, styled, type BoxProps } from "@mui/material"
import { BookCardHorizontal } from "./BookCardHorizontal"
import { BookCardVertical } from "./BookCardVertical"
import { useDefaultBookCardClickHandler } from "./useDefaultBookCardClickHandler"

const ContainerBox = styled(Box)<{
  size: "small" | "large"
  mode: "vertical" | "horizontal" | "compact"
}>(({ theme, mode }) => ({
  cursor: "pointer",
  position: "relative",
  display: "flex",
  flexDirection: mode === "vertical" ? "column" : "row",
  flexGrow: 1,
  "-webkit-tap-highlight-color": "transparent",
  overflow: "hidden",
  ...((mode === "horizontal" || mode === "compact") && {
    padding: theme.spacing(1),
  }),
  ...((mode === "horizontal" || mode === "compact") && {
    paddingLeft: theme.spacing(2),
  }),
}))

export const BookCard = ({
  mode,
  bookId,
  enableActions = true,
  onItemClick,
  size = "large",
  ...rest
}: {
  mode: "vertical" | "horizontal" | "compact"
  bookId: string
  enableActions?: boolean
  onItemClick?: (id: string) => void
  size?: "small" | "large"
} & BoxProps) => {
  const onDefaultItemClick = useDefaultBookCardClickHandler()

  const onCardClick = () => {
    if (onItemClick) return onItemClick(bookId)
    return onDefaultItemClick(bookId)
  }

  if (mode === "horizontal") {
    return (
      <ContainerBox
        onClick={onCardClick}
        size={size}
        mode={mode}
        data-book-card-container={bookId}
        {...rest}
      >
        <BookCardHorizontal bookId={bookId} withDrawerActions={enableActions} />
      </ContainerBox>
    )
  }

  if (mode === "compact") {
    return (
      <ContainerBox
        onClick={onCardClick}
        size={size}
        mode={mode}
        data-book-card-container={bookId}
        {...rest}
      >
        <BookCardHorizontal
          withCover={false}
          withAuthors={false}
          withDownloadIcons
          bookId={bookId}
          withDrawerActions={enableActions}
        />
      </ContainerBox>
    )
  }

  return (
    <ContainerBox
      onClick={onCardClick}
      size={size}
      mode={mode}
      data-book-card-container={bookId}
      {...rest}
    >
      <BookCardVertical bookId={bookId} />
    </ContainerBox>
  )
}
