import { Alert, Stack, Typography, styled } from "@mui/material"
import { memo } from "react"
import { type PathParam, useParams } from "react-router"
import { Page } from "../../../../common/Page"
import { NotFoundPage } from "../../../../common/NotFoundPage"
import { TopBarNavigation } from "../../../../navigation/TopBarNavigation"
import { useBook } from "../../../../books/states"
import { useLink } from "../../../../links/states"
import { pluginsByType } from "../../../../integrations/plugins/configure"
import { useBookDownloadState } from "../../../../download/states"
import { DownloadBookStep } from "../../../../books/optimize/DownloadBookStep"
import { OptimizeStep } from "../../../../books/optimize/OptimizeStep"
import { OptimizePageContainer } from "../../../../books/optimize/OptimizePageContainer"
import { TestBookButton } from "../../../../books/optimize/actions/TestBookButton"
import { BookOptimizeActionsMenu } from "../../../../books/optimize/actions/BookOptimizeActionsMenu"
import type { ROUTES } from "../../../../navigation/routes"

const TopBarActionsStack = styled(Stack)(({ theme }) => ({
  flexDirection: "row",
  alignItems: "center",
  gap: theme.spacing(1),
}))

export const BookOptimizeScreen = memo(function BookOptimizeScreen() {
  const { id: bookId } = useParams<PathParam<typeof ROUTES.BOOK_OPTIMIZE>>()
  const { data: book } = useBook({ id: bookId })
  const { data: link } = useLink({ id: book?.links[0] })

  const plugin = link?.type ? pluginsByType[link.type] : undefined
  const canUploadToDataSource = plugin?.canUpsertFile ?? false

  const downloadState = useBookDownloadState(bookId)
  const isDownloaded = downloadState?.downloadState === "downloaded"

  const linkFileName = book?.metadata?.find(
    (item) => item.type === "link",
  )?.title

  if (
    !bookId ||
    book === null ||
    link === null ||
    (link !== undefined && !plugin)
  ) {
    return <NotFoundPage />
  }

  const isReadyToOptimize = !!book && !!link && isDownloaded

  return (
    <Page bottomGutter={false}>
      <TopBarNavigation
        title="Optimize book"
        showBack
        rightComponent={
          isReadyToOptimize ? (
            <TopBarActionsStack>
              <TestBookButton bookId={bookId} />
              <BookOptimizeActionsMenu bookId={bookId} />
            </TopBarActionsStack>
          ) : undefined
        }
      />
      {isReadyToOptimize && !canUploadToDataSource && (
        <Alert severity="info">
          This data source can&apos;t upload files back yet. Changes can only be
          applied locally.
        </Alert>
      )}
      {isReadyToOptimize ? (
        <OptimizeStep
          book={book}
          link={link}
          canUploadToDataSource={canUploadToDataSource}
        />
      ) : (
        <OptimizePageContainer>
          {!book || !link ? (
            <Typography variant="body2" color="text.secondary">
              Loading book…
            </Typography>
          ) : (
            <DownloadBookStep book={book} displayFileName={linkFileName} />
          )}
        </OptimizePageContainer>
      )}
    </Page>
  )
})
