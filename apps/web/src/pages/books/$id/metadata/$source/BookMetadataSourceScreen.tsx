import { memo, useMemo } from "react"
import { type PathParam, useParams } from "react-router"
import { Stack, Typography, styled } from "@mui/material"
import {
  type BookMetadata,
  getBookMetadataSource,
  LEGACY_CATALOG_SOURCE_NAME,
} from "@oboku/shared"
import type { DeepReadonlyArray } from "rxdb"
import { NotFoundPage } from "../../../../../common/NotFoundPage"
import { Page } from "../../../../../common/Page"
import { TopBarNavigation } from "../../../../../navigation/TopBarNavigation"
import { useBook } from "../../../../../books/states"
import {
  type BookMetadataSource,
  getBookMetadataSourceLabel,
  isBookMetadataSource,
} from "../../../../../books/metadata/sources"
import {
  CatalogSourceContent,
  FileSourceContent,
  LinkSourceContent,
  UserSourceContent,
} from "../../../../../books/details/metadataSource"
import { PageContainer } from "../../../../../common/PageContainer"
import type { ROUTES } from "../../../../../navigation/routes"

const MetadataSourcePageContainer = styled(PageContainer)({
  display: "flex",
  flexDirection: "column",
  flex: 1,
  minHeight: 0,
})

const SourceIntroStack = styled(Stack)(function styleSourceIntroStack({
  theme,
}) {
  return {
    padding: theme.spacing(1, 2, 2),
  }
})

const SOURCE_DESCRIPTIONS: Record<BookMetadataSource, string> = {
  link: "Information exposed on the storage provider link.",
  file: "Information embedded inside the file itself.",
  catalog: "Information an online catalog holds about the book.",
  user: "Information you entered manually.",
}

/**
 * The entry of `book.metadata` the requested source holds, or `undefined`
 * when the book has none yet.
 */
const findSourceEntry = (
  metadata: DeepReadonlyArray<BookMetadata> | undefined,
  source: BookMetadataSource,
) => metadata?.find((entry) => getBookMetadataSource(entry) === source)

export const BookMetadataSourceScreen = memo(
  function BookMetadataSourceScreen() {
    const { id: bookId, source } =
      useParams<PathParam<typeof ROUTES.BOOK_METADATA_SOURCE>>()
    const { data: book } = useBook({ id: bookId })

    const validSource = isBookMetadataSource(source) ? source : undefined
    const entry = useMemo(
      () =>
        validSource ? findSourceEntry(book?.metadata, validSource) : undefined,
      [book?.metadata, validSource],
    )

    if (!bookId || !validSource || book === null) {
      return <NotFoundPage />
    }

    return (
      <Page bottomGutter={false}>
        <TopBarNavigation
          title={getBookMetadataSourceLabel(validSource)}
          showBack
        />
        <MetadataSourcePageContainer disableGutters>
          <SourceIntroStack>
            <Typography variant="overline" color="text.secondary">
              Metadata source
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {SOURCE_DESCRIPTIONS[validSource]}
            </Typography>
          </SourceIntroStack>
          {validSource === "link" && (
            <LinkSourceContent
              metadata={entry?.type === "link" ? entry : undefined}
            />
          )}
          {validSource === "file" && (
            <FileSourceContent
              entry={entry?.type === "file" ? entry : undefined}
            />
          )}
          {validSource === "catalog" && (
            <CatalogSourceContent
              entry={
                entry?.type === "catalog" ||
                entry?.type === LEGACY_CATALOG_SOURCE_NAME
                  ? entry
                  : undefined
              }
            />
          )}
          {validSource === "user" && (
            <UserSourceContent
              bookId={bookId}
              metadata={entry?.type === "user" ? entry : undefined}
            />
          )}
        </MetadataSourcePageContainer>
      </Page>
    )
  },
)
