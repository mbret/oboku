import { Alert, Container, Tab, Tabs, Typography, styled } from "@mui/material"
import { memo, type SyntheticEvent, useCallback } from "react"
import { useParams, useSearchParams } from "react-router"
import { Page } from "../../../../common/Page"
import { NotFoundPage } from "../../../../common/NotFoundPage"
import { TopBarNavigation } from "../../../../navigation/TopBarNavigation"
import { useBook } from "../../../../books/states"
import { useLink } from "../../../../links/states"
import { pluginsByType } from "../../../../plugins/configure"
import { useBookDownloadState } from "../../../../download/states"
import { DownloadBookStep } from "../../../../books/optimize/DownloadBookStep"
import { OptimizeStep } from "../../../../books/optimize/OptimizeStep"
import { TestBookButton } from "../../../../books/optimize/actions/TestBookButton"
import {
  BOOK_OPTIMIZE_TAB_PARAM,
  BOOK_OPTIMIZE_TABS,
  DEFAULT_BOOK_OPTIMIZE_TAB,
  isBookOptimizeTab,
  type BookOptimizeTab,
} from "../../../../books/optimize/tabs"

type ScreenParams = {
  id: string
}

const PageContainer = styled(Container)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  flex: 1,
  minHeight: 0,
  marginLeft: 0,
  marginRight: "auto",
  paddingTop: theme.spacing(2),
  paddingBottom: theme.spacing(2),
  gap: theme.spacing(2),
}))

export const BookOptimizeScreen = memo(function BookOptimizeScreen() {
  const { id: bookId } = useParams<ScreenParams>()
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: book } = useBook({ id: bookId })
  const { data: link } = useLink({ id: book?.links[0] })

  const plugin = link?.type ? pluginsByType[link.type] : undefined
  const canUploadToDataSource = plugin?.canUpsertFile ?? false

  const downloadState = useBookDownloadState(bookId)
  const isDownloaded = downloadState?.downloadState === "downloaded"

  const linkFileName = book?.metadata?.find(
    (item) => item.type === "link",
  )?.title

  const rawTab = searchParams.get(BOOK_OPTIMIZE_TAB_PARAM)
  const currentTab: BookOptimizeTab = isBookOptimizeTab(rawTab)
    ? rawTab
    : DEFAULT_BOOK_OPTIMIZE_TAB

  const handleTabChange = useCallback(
    (_event: SyntheticEvent, value: BookOptimizeTab) => {
      const next = new URLSearchParams(searchParams)
      next.set(BOOK_OPTIMIZE_TAB_PARAM, value)
      setSearchParams(next, { replace: true })
    },
    [searchParams, setSearchParams],
  )

  if (
    !bookId ||
    book === null ||
    link === null ||
    (link !== undefined && !plugin)
  ) {
    return <NotFoundPage />
  }

  return (
    <Page bottomGutter={false}>
      <TopBarNavigation
        title="Optimize book"
        showBack
        rightComponent={
          bookId && book && link && isDownloaded ? (
            <TestBookButton bookId={bookId} />
          ) : undefined
        }
      />
      {book && link && isDownloaded && !canUploadToDataSource && (
        <Alert severity="info">
          This data source can&apos;t upload files back yet. Changes can only be
          applied locally.
        </Alert>
      )}
      {book && link && isDownloaded && (
        <Tabs
          value={currentTab}
          indicatorColor="primary"
          onChange={handleTabChange}
        >
          <Tab label="Metadata" value={BOOK_OPTIMIZE_TABS.METADATA} />
          <Tab label="Content" value={BOOK_OPTIMIZE_TABS.CONTENT} />
        </Tabs>
      )}
      <PageContainer maxWidth="md">
        {!book || !link ? (
          <Typography variant="body2" color="text.secondary">
            Loading book…
          </Typography>
        ) : !isDownloaded ? (
          <DownloadBookStep book={book} displayFileName={linkFileName} />
        ) : (
          <OptimizeStep
            book={book}
            link={link}
            canUploadToDataSource={canUploadToDataSource}
            currentTab={currentTab}
          />
        )}
      </PageContainer>
    </Page>
  )
})
