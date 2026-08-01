import { Alert, Typography } from "@mui/material"
import type { BookDocType, LinkDocType } from "@oboku/shared"
import type { DeepReadonlyObject } from "rxdb"
import { BookOptimizeProvider } from "./BookOptimizeProvider"
import { MetadataTab } from "./MetadataTab"
import { ContentTab } from "./ContentTab"
import { BookOptimizeActionBar } from "./actions/BookOptimizeActionBar"
import { BOOK_OPTIMIZE_TABS, type BookOptimizeTab } from "./tabs"
import { useFileInspection } from "./useFileInspection"

type Props = {
  book: DeepReadonlyObject<BookDocType>
  link: DeepReadonlyObject<LinkDocType>
  canUploadToDataSource: boolean
  currentTab: BookOptimizeTab
}

export function OptimizeStep({
  book,
  link,
  canUploadToDataSource,
  currentTab,
}: Props) {
  const { data: inspection, isError } = useFileInspection(book._id)

  if (isError) {
    return (
      <Alert severity="error">
        This book file could not be read. It may be corrupted or in an
        unsupported format.
      </Alert>
    )
  }

  if (!inspection) {
    return (
      <Typography variant="body2" color="text.secondary">
        Inspecting the book…
      </Typography>
    )
  }

  return (
    <BookOptimizeProvider
      book={book}
      link={link}
      canUploadToDataSource={canUploadToDataSource}
      inspection={inspection}
    >
      <MetadataTab hidden={currentTab !== BOOK_OPTIMIZE_TABS.METADATA} />

      <ContentTab hidden={currentTab !== BOOK_OPTIMIZE_TABS.CONTENT} />

      <BookOptimizeActionBar />
    </BookOptimizeProvider>
  )
}
