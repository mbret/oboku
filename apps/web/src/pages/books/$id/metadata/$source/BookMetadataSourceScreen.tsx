import { memo, useMemo } from "react"
import { useParams } from "react-router"
import { Container, Stack, Typography, styled } from "@mui/material"
import type { BookMetadata } from "@oboku/shared"
import type { DeepReadonlyArray, DeepReadonlyObject } from "rxdb"
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
  FileSourceContent,
  GoogleBookApiSourceContent,
  LinkSourceContent,
  UserSourceContent,
} from "../../../../../books/details/metadataSource"

type ScreenParams = {
  id: string
  source: string
}

const PageContainer = styled(Container)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  flex: 1,
  minHeight: 0,
  paddingTop: theme.spacing(1),
  gap: theme.spacing(2),
}))

const SOURCE_DESCRIPTIONS: Record<BookMetadataSource, string> = {
  link: "Information exposed on the storage provider link.",
  file: "Information embedded inside the file itself.",
  googleBookApi: "Information fetched from the Google Books API.",
  user: "Information you entered manually.",
}

/**
 * Narrows a single entry of `book.metadata` to the requested variant.
 * Returns `undefined` when the book has no entry of that type yet.
 */
const findSourceMetadata = <TSource extends BookMetadataSource>(
  metadata: DeepReadonlyArray<BookMetadata> | undefined,
  source: TSource,
): DeepReadonlyObject<Extract<BookMetadata, { type: TSource }>> | undefined =>
  metadata?.find(
    (
      item,
    ): item is DeepReadonlyObject<Extract<BookMetadata, { type: TSource }>> =>
      item.type === source,
  )

export const BookMetadataSourceScreen = memo(
  function BookMetadataSourceScreen() {
    const { id: bookId, source } = useParams<ScreenParams>()
    const { data: book } = useBook({ id: bookId })

    const validSource = isBookMetadataSource(source) ? source : undefined
    const metadata = useMemo(
      () =>
        validSource
          ? findSourceMetadata(book?.metadata, validSource)
          : undefined,
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
        <PageContainer maxWidth="md">
          <Stack>
            <Typography variant="overline" color="text.secondary">
              Metadata source
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {SOURCE_DESCRIPTIONS[validSource]}
            </Typography>
          </Stack>
          {validSource === "link" && (
            <LinkSourceContent
              metadata={metadata?.type === "link" ? metadata : undefined}
            />
          )}
          {validSource === "file" && (
            <FileSourceContent
              metadata={metadata?.type === "file" ? metadata : undefined}
            />
          )}
          {validSource === "googleBookApi" && (
            <GoogleBookApiSourceContent
              metadata={
                metadata?.type === "googleBookApi" ? metadata : undefined
              }
            />
          )}
          {validSource === "user" && (
            <UserSourceContent
              bookId={bookId}
              metadata={metadata?.type === "user" ? metadata : undefined}
            />
          )}
        </PageContainer>
      </Page>
    )
  },
)
