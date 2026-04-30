import { memo } from "react"
import Button from "@mui/material/Button"
import {
  CloudDownloadRounded,
  MenuBookOutlined,
  MoreVertOutlined,
} from "@mui/icons-material"
import { TopBarNavigation } from "../../navigation/TopBarNavigation"
import { Typography, Container, Stack, IconButton, styled } from "@mui/material"
import { useNavigate, useParams } from "react-router"
import { Alert } from "@mui/material"
import { useCancelBookDownload, useDownloadBook } from "../../download"
import { useBook } from "../states"
import { useLink } from "../../links/states"
import { DataSourceSection } from "./DataSourceSection"
import { useBookDownloadState } from "../../download/states"
import { useMetadataFromBook } from "../metadata"
import { MetadataSourcePane } from "./MetadataSourcePane"
import { BookMetadataPolicyPane } from "../metadata/BookMetadataPolicyPane"
import { useResolvedMetadataFetchEnabled } from "../../metadata/useResolvedMetadataFetchEnabled"
import { useIncrementalBookPatch } from "../useIncrementalBookPatch"
import { CoverPane } from "./CoverPane"
import { MetadataPane } from "./MetadataPane"
import { DebugInfo } from "../../debug/DebugInfo"
import { CollectionsPane } from "./CollectionsPane"
import { useBookActionDrawer } from "../drawer/BookActionsDrawer"
import { useSafeGoBack } from "../../navigation/useSafeGoBack"
import { isDebugEnabled } from "../../debug/isDebugEnabled.shared"
import { Logger } from "../../debug/logger.shared"
import { ROUTES } from "../../navigation/routes"
import { Page } from "../../common/Page"
import { NotFoundPage } from "../../common/NotFoundPage"

type ScreenParams = {
  id: string
}

const PageContainer = styled(Container)(({ theme }) => ({
  display: "flex",
  flexDirection: "column",
  gap: theme.spacing(2),
}))

const HeaderStack = styled(Stack)(({ theme }) => ({
  flexDirection: "column",
  gap: theme.spacing(1),
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
  [theme.breakpoints.up("sm")]: {
    flexDirection: "row",
    gap: theme.spacing(3),
  },
}))

const HeaderTextStack = styled(Stack)(({ theme }) => ({
  alignItems: "center",
  flexFlow: "column",
  justifyContent: "center",
  paddingTop: 0,
  [theme.breakpoints.up("sm")]: {
    alignItems: "flex-start",
    justifyContent: "flex-start",
    paddingTop: theme.spacing(5),
  },
}))

const ItalicTypography = styled(Typography)({
  fontStyle: "italic",
})

const ActionsStack = styled(Stack)(({ theme }) => ({
  flexDirection: "row",
  gap: theme.spacing(1),
  marginBottom: theme.spacing(1),
  display: "flex",
  width: "100%",
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
}))

const ActionButton = styled(Button)(({ theme }) => ({
  flex: 1,
  minWidth: 260,
  [theme.breakpoints.up("sm")]: {
    flex: "none",
  },
}))

const SectionStack = styled(Stack)(({ theme }) => ({
  paddingLeft: theme.spacing(2),
  paddingRight: theme.spacing(2),
}))

const SectionInnerStack = styled(Stack)(({ theme }) => ({
  gap: theme.spacing(1),
}))

export const BookDetailsScreen = memo(() => {
  const navigate = useNavigate()
  const { mutate: downloadFile } = useDownloadBook()
  const cancelDownload = useCancelBookDownload()
  const { goBack } = useSafeGoBack()
  const { id = `-1` } = useParams<ScreenParams>()
  const { data: book } = useBook({ id })
  const downloadState = useBookDownloadState(book?._id)
  const { data: link } = useLink({ id: book?.links[0] })
  const metadata = useMetadataFromBook(book)
  const openBookActionDrawer = useBookActionDrawer({
    onDeleteBook: () => {
      goBack()
    },
  })
  const {
    override: metadataFetchOverride,
    isProtected: metadataFetchIsProtected,
    resolved: metadataFetchResolved,
  } = useResolvedMetadataFetchEnabled({ kind: "book", book })
  const { mutate: incrementalBookPatch } = useIncrementalBookPatch()

  if (isDebugEnabled()) {
    Logger.info(`BookDetailsScreen`, { book, link })
  }

  if (book === null) return <NotFoundPage />

  return (
    <Page>
      <TopBarNavigation color="transparent" showBack={true} />
      <PageContainer disableGutters>
        <DebugInfo
          info={{
            id: book?._id || ``,
            linkId: book?.links[0] ?? "",
          }}
        />
        <HeaderStack>
          <CoverPane bookId={book?._id} />
          <HeaderTextStack>
            <Typography variant="body1">
              {metadata?.title || "Unknown"}
            </Typography>
            <ItalicTypography variant="body2">
              By {metadata?.authors?.join(", ") || "Unknown"}
            </ItalicTypography>
          </HeaderTextStack>
        </HeaderStack>
        <ActionsStack>
          {downloadState?.downloadState === "none" && (
            <ActionButton
              variant="outlined"
              color="primary"
              startIcon={<CloudDownloadRounded />}
              onClick={() => book && downloadFile(book)}
              disabled={!link}
            >
              Download
            </ActionButton>
          )}
          {downloadState?.downloadState === "downloading" && (
            <ActionButton
              variant="outlined"
              color="primary"
              onClick={() => book?._id && cancelDownload(book._id)}
            >
              Downloading...
            </ActionButton>
          )}
          {downloadState?.downloadState === "downloaded" && (
            <ActionButton
              variant="contained"
              color="primary"
              startIcon={<MenuBookOutlined />}
              onClick={() =>
                book?._id && navigate(ROUTES.READER.replace(":id", book._id))
              }
            >
              Read
            </ActionButton>
          )}
          <IconButton
            onClick={() => {
              openBookActionDrawer({
                openedWith: book?._id,
                actionsBlackList: ["goToDetails"],
              })
            }}
          >
            <MoreVertOutlined />
          </IconButton>
        </ActionsStack>
        <SectionStack>
          <SectionInnerStack>
            {book?.metadataUpdateStatus === "fetching" && (
              <Alert severity="warning">
                Retrieving metadata information...
              </Alert>
            )}
            <MetadataPane bookId={book?._id} />
            <CollectionsPane bookId={book?._id} />
          </SectionInnerStack>
        </SectionStack>
        <MetadataSourcePane bookId={id} />
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
        <DataSourceSection bookId={id} />
      </PageContainer>
    </Page>
  )
})
