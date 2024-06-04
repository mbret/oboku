import { ComponentProps, memo } from "react"
import { BookListListItem } from "./BookListListItem"

export const BookListCompactItem = memo(
  ({ ...rest }: ComponentProps<typeof BookListListItem>) => {
    return (
      <BookListListItem
        withCover={false}
        withAuthors={false}
        withDownloadIcons
        {...rest}
      />
    )
  }
)
