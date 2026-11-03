import { Alert, Typography } from "@mui/material"
import type { BookDocType, LinkDocType } from "@oboku/shared"
import type { SyntheticEvent } from "react"
import type { DeepReadonlyObject } from "rxdb"
import { BookOptimizeProvider } from "./BookOptimizeProvider"
import { BookOptimizeTabs } from "./BookOptimizeTabs"
import { MetadataTab } from "./MetadataTab"
import { ContentTab } from "./ContentTab"
import { OptimizePageContainer } from "./OptimizePageContainer"
import { BookOptimizeActionBar } from "./actions/BookOptimizeActionBar"
import { BOOK_OPTIMIZE_TABS, type BookOptimizeTab } from "./tabs"
import { useFileInspection } from "./useFileInspection"

type Props = {
  book: DeepReadonlyObject<BookDocType>
  link: DeepReadonlyObject<LinkDocType>
  canUploadToDataSource: boolean
  currentTab: BookOptimizeTab
  onTabChange: (event: SyntheticEvent, tab: BookOptimizeTab) => void
}

export function OptimizeStep({
  book,
  link,
  canUploadToDataSource,
  currentTab,
  onTabChange,
}: Props) {
  const { data: inspection, isError } = useFileInspection(book._id)

  if (isError) {
    return (
      <OptimizePageContainer>
        <Alert severity="error">
          This book file could not be read. It may be corrupted or in an
          unsupported format.
        </Alert>
      </OptimizePageContainer>
    )
  }

  if (!inspection) {
    return (
      <OptimizePageContainer>
        <Typography variant="body2" color="text.secondary">
          Inspecting the book…
        </Typography>
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
      <BookOptimizeTabs value={currentTab} onChange={onTabChange} />
      <OptimizePageContainer>
        <MetadataTab hidden={currentTab !== BOOK_OPTIMIZE_TABS.METADATA} />

        <ContentTab hidden={currentTab !== BOOK_OPTIMIZE_TABS.CONTENT} />

        <BookOptimizeActionBar />
      </OptimizePageContainer>
    </BookOptimizeProvider>
  )
}
