import { LinkOffRounded } from "@mui/icons-material"
import { ListItemButton, ListItemIcon, ListItemText } from "@mui/material"
import { CollectionDocType } from "@oboku/shared"
import { getCollectionComputedMetadata } from "../collections/getCollectionComputedMetadata"

export const CollectionDanglingBooks = ({
  danglingBooks,
  doc,
  onClick,
}: {
  doc: CollectionDocType
  danglingBooks: string[]
  onClick?: () => void
}) => {
  return (
    <ListItemButton alignItems="flex-start" key={doc._id} onClick={onClick}>
      <ListItemIcon>
        <LinkOffRounded />
      </ListItemIcon>
      <ListItemText
        primary={`Non existing books`}
        secondary={`
        Collection "${getCollectionComputedMetadata(doc).title}" contains ${danglingBooks.length} books that does not exist anymore. It is safe to repair but you should verify your collection before and afterward.
      `}
      />
    </ListItemButton>
  )
}
