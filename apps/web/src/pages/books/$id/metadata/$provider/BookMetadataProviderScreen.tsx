import { memo, useMemo } from "react"
import { type PathParam, useParams } from "react-router"
import { Stack, Typography, styled } from "@mui/material"
import {
  type BookMetadata,
  getBookMetadataProvider,
  LEGACY_CATALOG_SOURCE_NAME,
} from "@oboku/shared"
import type { DeepReadonlyArray } from "rxdb"
import { NotFoundPage } from "../../../../../common/NotFoundPage"
import { Page } from "../../../../../common/Page"
import { TopBarNavigation } from "../../../../../navigation/TopBarNavigation"
import { useBook } from "../../../../../books/states"
import {
  type BookMetadataProvider,
  getBookMetadataProviderLabel,
  isBookMetadataProvider,
} from "../../../../../books/metadata/providers"
import {
  CatalogProviderContent,
  FileProviderContent,
  LinkProviderContent,
  UserProviderContent,
} from "../../../../../books/details/metadataProvider"
import { PageContainer } from "../../../../../common/PageContainer"
import type { ROUTES } from "../../../../../navigation/routes"

const MetadataProviderPageContainer = styled(PageContainer)({
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

const PROVIDER_DESCRIPTIONS: Record<BookMetadataProvider, string> = {
  link: "Information from the book's file at its source.",
  file: "Information embedded inside the file itself.",
  catalog: "Information an online catalog holds about the book.",
  user: "Information you entered manually.",
}

/**
 * The entry of `book.metadata` the requested provider holds, or `undefined`
 * when the book has none yet.
 */
const findProviderEntry = (
  metadata: DeepReadonlyArray<BookMetadata> | undefined,
  provider: BookMetadataProvider,
) => metadata?.find((entry) => getBookMetadataProvider(entry) === provider)

export const BookMetadataProviderScreen = memo(
  function BookMetadataProviderScreen() {
    const { id: bookId, provider } =
      useParams<PathParam<typeof ROUTES.BOOK_METADATA_PROVIDER>>()
    const { data: book } = useBook({ id: bookId })

    const validProvider = isBookMetadataProvider(provider)
      ? provider
      : undefined
    const entry = useMemo(
      () =>
        validProvider
          ? findProviderEntry(book?.metadata, validProvider)
          : undefined,
      [book?.metadata, validProvider],
    )

    if (!bookId || !validProvider || book === null) {
      return <NotFoundPage />
    }

    return (
      <Page bottomGutter={false}>
        <TopBarNavigation
          title={getBookMetadataProviderLabel(validProvider)}
          showBack
        />
        <MetadataProviderPageContainer disableGutters>
          <SourceIntroStack>
            <Typography variant="overline" color="text.secondary">
              Metadata provider
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {PROVIDER_DESCRIPTIONS[validProvider]}
            </Typography>
          </SourceIntroStack>
          {validProvider === "link" && (
            <LinkProviderContent
              metadata={entry?.type === "link" ? entry : undefined}
            />
          )}
          {validProvider === "file" && (
            <FileProviderContent
              entry={entry?.type === "file" ? entry : undefined}
            />
          )}
          {validProvider === "catalog" && (
            <CatalogProviderContent
              entry={
                entry?.type === "catalog" ||
                entry?.type === LEGACY_CATALOG_SOURCE_NAME
                  ? entry
                  : undefined
              }
            />
          )}
          {validProvider === "user" && (
            <UserProviderContent
              bookId={bookId}
              metadata={entry?.type === "user" ? entry : undefined}
            />
          )}
        </MetadataProviderPageContainer>
      </Page>
    )
  },
)
