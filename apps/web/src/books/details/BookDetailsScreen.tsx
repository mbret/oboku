import { memo } from "react"
import Button from "@mui/material/Button"
import {
  CloudDownloadRounded,
  MenuBookOutlined,
  MoreVertOutlined,
} from "@mui/icons-material"
import { TopBarNavigation } from "../../navigation/TopBarNavigation"
import { Typography, Container, Stack, IconButton } from "@mui/material"
import { useNavigate, useParams } from "react-router"
import { Alert } from "@mui/material"
import {
  useCancelBookDownload,
  useDownloadBook,
} from "../../download/useDownloadBook"
import { useBook } from "../states"
import { useLink } from "../../links/states"
import { DataSourceSection } from "./DataSourceSection"
import { useBookDownloadState } from "../../download/states"
import { useMetadataFromBook } from "../metadata"
import { MetadataSourcePane } from "./MetadataSourcePane"
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

  if (isDebugEnabled()) {
    Logger.info(`BookDetailsScreen`, { book, link })
  }

  if (book === null) return <NotFoundPage />

  return (
    <Page>
      <TopBarNavigation color="transparent" showBack={true} />
      <Container sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <DebugInfo
          info={{
            id: book?._id || ``,
            linkId: book?.links[0] ?? "",
          }}
        />
        <Stack
          sx={{
            flexDirection: ["column", "row"],
            gap: [1, 3],
          }}
        >
          <CoverPane bookId={book?._id} />
          <Stack
            sx={{
              alignItems: ["center", "flex-start"],
              flexFlow: "column",
              justifyContent: ["center", "flex-start"],
              pt: [0, 5],
            }}
          >
            <Typography variant="body1">
              {metadata?.title || "Unknown"}
            </Typography>
            <Typography variant="body2" fontStyle="italic">
              By {metadata?.authors?.join(", ") || "Unknown"}
            </Typography>
          </Stack>
        </Stack>
        <Stack
          sx={{
            flexDirection: ["row", "row"],
            gap: 1,
            mb: 1,
            display: "flex",
            width: "100%",
          }}
        >
          {downloadState?.downloadState === "none" && (
            <Button
              variant="outlined"
              color="primary"
              sx={{
                flex: [1, "none"],
                minWidth: 260,
              }}
              startIcon={<CloudDownloadRounded />}
              onClick={() => book && downloadFile(book)}
              disabled={!link}
            >
              Download
            </Button>
          )}
          {downloadState?.downloadState === "downloading" && (
            <Button
              sx={{
                flex: [1, "none"],
                minWidth: 260,
              }}
              variant="outlined"
              color="primary"
              onClick={() => book?._id && cancelDownload(book._id)}
            >
              Downloading...
            </Button>
          )}
          {downloadState?.downloadState === "downloaded" && (
            <Button
              variant="contained"
              color="primary"
              sx={{
                flex: [1, "none"],
                minWidth: 260,
              }}
              startIcon={<MenuBookOutlined />}
              onClick={() =>
                book?._id && navigate(ROUTES.READER.replace(":id", book._id))
              }
            >
              Read
            </Button>
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
        </Stack>
        <Stack>
          <Stack gap={1}>
            {book?.metadataUpdateStatus === "fetching" && (
              <Alert severity="warning">
                Retrieving metadata information...
              </Alert>
            )}
            <MetadataPane bookId={book?._id} />
            <CollectionsPane bookId={book?._id} />
          </Stack>
        </Stack>
        <MetadataSourcePane bookId={id} />
        <DataSourceSection bookId={id} />
      </Container>
    </Page>
  )
})
