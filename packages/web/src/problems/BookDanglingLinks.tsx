import { LinkOffRounded } from "@mui/icons-material"
import { ListItemButton, ListItemIcon, ListItemText } from "@mui/material"
import { BookDocType } from "@oboku/shared"
import { DeepReadonlyObject } from "rxdb"
import { getMetadataFromBook } from "../books/metadata"

export const BookDanglingLinks = ({
  danglingBooks,
  doc,
  onClick,
}: {
  doc: DeepReadonlyObject<BookDocType>
  danglingBooks: string[]
  onClick?: () => void
}) => {
  return (
    <ListItemButton alignItems="flex-start" key={doc._id} onClick={onClick}>
      <ListItemIcon>
        <LinkOffRounded />
      </ListItemIcon>
      <ListItemText
        primary={`Non existing link(s)`}
        secondary={`
        Book "${getMetadataFromBook(doc).title}" has ${danglingBooks.length} link(s) that does not exist anymore. This can mean that a book was linked to a datasource that has been removed. In this case the book cannot be retrieved since the link is not valid. You can safely repair it.
      `}
      />
    </ListItemButton>
  )
}
