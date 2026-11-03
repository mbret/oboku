import { Alert, Typography } from "@mui/material"
import type { BookDocType, LinkDocType } from "@oboku/shared"
import type { DeepReadonlyObject } from "rxdb"
import { BookOptimizeProvider } from "./BookOptimizeProvider"
import { BookOptimizeTabs } from "./BookOptimizeTabs"
import { MetadataTab } from "./MetadataTab"
import { ContentTab } from "./ContentTab"
import { OptimizePageContainer } from "./OptimizePageContainer"
import { BookOptimizeActionBar } from "./actions/BookOptimizeActionBar"
import { BOOK_OPTIMIZE_TABS } from "./tabs"
import { useBookOptimizeTab } from "./useBookOptimizeTab"
import { useFileInspection } from "./useFileInspection"

type Props = {
  book: DeepReadonlyObject<BookDocType>
  link: DeepReadonlyObject<LinkDocType>
  canUploadToDataSource: boolean
}

export function OptimizeStep({ book, link, canUploadToDataSource }: Props) {
  const { data: inspection, isError } = useFileInspection(book._id)
  const { tab } = useBookOptimizeTab()

  if (isError || !inspection) {
    return (
      <OptimizePageContainer>
        {isError ? (
          <Alert severity="error">
            This book file could not be read. It may be corrupted or in an
            unsupported format.
          </Alert>
        ) : (
          <Typography variant="body2" color="text.secondary">
            Inspecting the book…
          </Typography>
        )}
      </OptimizePageContainer>
    )
  }

  return (
    <BookOptimizeProvider
      key={book._id}
      book={book}
      link={link}
      canUploadToDataSource={canUploadToDataSource}
      inspection={inspection}
    >
      <BookOptimizeTabs />
      <OptimizePageContainer>
        <MetadataTab hidden={tab !== BOOK_OPTIMIZE_TABS.METADATA} />

        <ContentTab hidden={tab !== BOOK_OPTIMIZE_TABS.CONTENT} />

        <BookOptimizeActionBar />
      </OptimizePageContainer>
    </BookOptimizeProvider>
  )
}
