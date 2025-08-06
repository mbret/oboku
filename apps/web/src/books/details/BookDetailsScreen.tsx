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
import { useDownloadBook } from "../../download/useDownloadBook"
import { useEnrichedBookState } from "../states"
import { useLink } from "../../links/states"
import { DataSourceSection } from "./DataSourceSection"
import { booksDownloadStateSignal } from "../../download/states"
import { useProtectedTagIds, useTagsByIds } from "../../tags/helpers"
import { useSignalValue } from "reactjrx"
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

type ScreenParams = {
  id: string
}

export const BookDetailsScreen = memo(() => {
  const navigate = useNavigate()
  const { mutate: downloadFile } = useDownloadBook()
  const { goBack } = useSafeGoBack()
  const { id = `-1` } = useParams<ScreenParams>()
  const book = useEnrichedBookState({
    bookId: id,
    normalizedBookDownloadsState: useSignalValue(booksDownloadStateSignal),
    protectedTagIds: useProtectedTagIds().data,
    tags: useTagsByIds().data,
  })
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

  return (
    <Stack
      style={{
        flex: 1,
        overflow: "auto",
      }}
      pb={4}
      gap={2}
    >
      <TopBarNavigation title="Book details" showBack={true} />
      <DebugInfo info={{ id: book?._id || ``, linkId: book?.links[0] ?? "" }} />
      <Container
        sx={{
          display: "flex",
          flexDirection: ["column", "row"],
          gap: [1, 3],
          mt: 2,
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
      </Container>
      <Container
        sx={{
          flexDirection: ["row", "row"],
          // flexWrap: "wrap",
          gap: 1,
          mb: 1,
          display: "flex",
          width: "100%",
        }}
      >
        {book?.downloadState === "none" && (
          <Button
            variant="outlined"
            color="primary"
            sx={{
              flex: [1, "none"],
              minWidth: 260,
            }}
            startIcon={<CloudDownloadRounded />}
            onClick={() => downloadFile(book)}
            disabled={!link}
          >
            Download
          </Button>
        )}
        {book?.downloadState === "downloading" && (
          <Button
            sx={{
              flex: [1, "none"],
              minWidth: 260,
            }}
            variant="outlined"
            color="primary"
            disabled
          >
            Downloading...
          </Button>
        )}
        {book?.downloadState === "downloaded" && (
          <Button
            variant="contained"
            color="primary"
            sx={{
              flex: [1, "none"],
              minWidth: 260,
            }}
            startIcon={<MenuBookOutlined />}
            onClick={() => navigate(ROUTES.READER.replace(":id", book._id))}
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
      </Container>
      <Container>
        <Stack gap={1}>
          {book?.metadataUpdateStatus === "fetching" && (
            <Alert severity="warning">Retrieving metadata information...</Alert>
          )}
          <MetadataPane bookId={book?._id} />
          <CollectionsPane bookId={book?._id} />
        </Stack>
      </Container>
      <Container disableGutters>
        <MetadataSourcePane bookId={id} />
        <DataSourceSection bookId={id} />
      </Container>
    </Stack>
  )
})
