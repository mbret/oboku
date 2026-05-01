import { memo } from "react"
import { Alert, Stack, styled } from "@mui/material"
import { useBook } from "../states"
import { MetadataPane } from "./MetadataPane"
import { CollectionsPane } from "./CollectionsPane"

type Props = {
  bookId: string
}

const SectionStack = styled(Stack)(({ theme }) => ({
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  gap: theme.spacing(1),
}))

export const BookDetailsTabPane = memo(function BookDetailsTabPane({
  bookId,
}: Props) {
  const { data: book } = useBook({ id: bookId })

  return (
    <SectionStack>
      {book?.metadataUpdateStatus === "fetching" && (
        <Alert severity="warning">Retrieving metadata information...</Alert>
      )}
      <MetadataPane bookId={bookId} />
      <CollectionsPane bookId={bookId} />
    </SectionStack>
  )
})
