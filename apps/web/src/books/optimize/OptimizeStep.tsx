import type { BookDocType, LinkDocType } from "@oboku/shared"
import type { DeepReadonlyObject } from "rxdb"
import { BookOptimizeProvider } from "./BookOptimizeProvider"
import { MetadataTab } from "./MetadataTab"
import { ContentTab } from "./ContentTab"
import { BookOptimizeActionBar } from "./actions/BookOptimizeActionBar"
import { BOOK_OPTIMIZE_TABS, type BookOptimizeTab } from "./tabs"

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
  return (
    <BookOptimizeProvider
      book={book}
      link={link}
      canUploadToDataSource={canUploadToDataSource}
    >
      <MetadataTab hidden={currentTab !== BOOK_OPTIMIZE_TABS.METADATA} />

      <ContentTab hidden={currentTab !== BOOK_OPTIMIZE_TABS.CONTENT} />

      <BookOptimizeActionBar />
    </BookOptimizeProvider>
  )
}
