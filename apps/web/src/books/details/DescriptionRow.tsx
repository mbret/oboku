import { Alert, Typography } from "@mui/material"
import { useBook } from "../states"
import { getMetadataFromBook } from "../metadata"
import { DescriptionText } from "../metadata/DescriptionText"

export const DescriptionRow = ({ bookId }: { bookId?: string }) => {
  const { data: book } = useBook({ id: bookId })

  const metadata = getMetadataFromBook(book)

  if (!metadata.description) {
    return <Alert severity="info">No synopsis! Try to refresh metadata.</Alert>
  }

  return (
    <Typography>
      <DescriptionText description={metadata.description} />
    </Typography>
  )
}
