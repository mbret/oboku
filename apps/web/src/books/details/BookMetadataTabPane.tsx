import { memo } from "react"
import { Stack, styled } from "@mui/material"
import { useBook } from "../states"
import { useResolvedMetadataFetchEnabled } from "../../metadata/useResolvedMetadataFetchEnabled"
import { useIncrementalBookPatch } from "../useIncrementalBookPatch"
import { MetadataSourcePane } from "./MetadataSourcePane"
import { BookMetadataPolicyPane } from "../metadata/BookMetadataPolicyPane"
import { DataSourceSection } from "./DataSourceSection"

type Props = {
  bookId: string
}

const TabStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(2),
}))

export const BookMetadataTabPane = memo(function BookMetadataTabPane({
  bookId,
}: Props) {
  const { data: book } = useBook({ id: bookId })
  const {
    override: metadataFetchOverride,
    isProtected: metadataFetchIsProtected,
    resolved: metadataFetchResolved,
  } = useResolvedMetadataFetchEnabled({ kind: "book", book })
  const { mutate: incrementalBookPatch } = useIncrementalBookPatch()

  return (
    <TabStack>
      <MetadataSourcePane bookId={bookId} />
      <BookMetadataPolicyPane
        override={metadataFetchOverride}
        isProtected={metadataFetchIsProtected}
        resolved={metadataFetchResolved}
        onChange={(next) => {
          if (!book) return
          incrementalBookPatch({
            doc: book._id,
            patch: { metadataFetchEnabled: next },
          })
        }}
        fileDownloadOverride={book?.metadataFileDownloadEnabled}
        onFileDownloadChange={(next) => {
          if (!book) return
          incrementalBookPatch({
            doc: book._id,
            patch: { metadataFileDownloadEnabled: next },
          })
        }}
      />
      <DataSourceSection bookId={bookId} />
    </TabStack>
  )
})
