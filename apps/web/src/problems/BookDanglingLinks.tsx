import { LinkOffRounded } from "@mui/icons-material"
import { ListItemButton, ListItemIcon, ListItemText } from "@mui/material"
import type { BookDocType } from "@oboku/shared"
import type { DeepReadonlyObject } from "rxdb"
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
        primary={`Missing book file(s)`}
        secondary={`
        Book "${getMetadataFromBook(doc).title}" has ${danglingBooks.length} file reference(s) that no longer exist. This can mean that the book came from a library sync that was removed. Its file then cannot be downloaded. You can safely repair it.
      `}
      />
    </ListItemButton>
  )
}
