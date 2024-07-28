import { LinkOffRounded } from "@mui/icons-material"
import { ListItemButton, ListItemIcon, ListItemText } from "@mui/material"
import { BookDocType } from "@oboku/shared"
import { DeepReadonlyObject } from "rxdb"
import { getMetadataFromBook } from "../books/metadata"

export const BookDanglingCollections = ({
  danglingBooks,
  doc,
  onClick
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
        primary={`Non existing collection(s)`}
        secondary={`
        Book "${getMetadataFromBook(doc).title}" is linked to ${danglingBooks.length} collection(s) that does not exist anymore.
      `}
      />
    </ListItemButton>
  )
}
