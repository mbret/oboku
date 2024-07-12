import { FC, useState, useEffect, memo } from "react"
import Button from "@mui/material/Button"
import {
  CloudDownloadRounded,
  EditRounded,
  MenuBookOutlined,
  MoreVertOutlined
} from "@mui/icons-material"
import { TopBarNavigation } from "../../navigation/TopBarNavigation"
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogActions,
  Typography,
  Drawer,
  DialogContent,
  TextField,
  Container,
  Stack,
  IconButton
} from "@mui/material"
import { useNavigate, useParams } from "react-router-dom"
import { Alert } from "@mui/material"
import { useDownloadBook } from "../../download/useDownloadBook"
import { ROUTES } from "../../constants"
import { useEnrichedBookState } from "../states"
import { useLink } from "../../links/states"
import { useEditLink } from "../../links/helpers"
import { DataSourceSection } from "./DataSourceSection"
import { booksDownloadStateSignal } from "../../download/states"
import { useProtectedTagIds, useTagsByIds } from "../../tags/helpers"
import { useSignalValue } from "reactjrx"
import { getMetadataFromBook, useMedataFromBook } from "../metadata"
import { MetadataSourcePane } from "./MetadataSourcePane"
import { CoverPane } from "./CoverPane"
import { MetadataPane } from "./MetadataPane"
import { DebugInfo } from "../../debug/DebugInfo"
import { CollectionsPane } from "./CollectionsPane"
import { useBookActionDrawer } from "../drawer/BookActionsDrawer"
import { useSafeGoBack } from "../../navigation/useSafeGoBack"
import { isDebugEnabled } from "../../debug/isDebugEnabled.shared"
import { Report } from "../../debug/report.shared"

type ScreenParams = {
  id: string
}

export const BookDetailsScreen = memo(() => {
  const navigate = useNavigate()
  const downloadFile = useDownloadBook()
  const { goBack } = useSafeGoBack()
  const [isLinkActionDrawerOpenWith, setIsLinkActionDrawerOpenWith] = useState<
    undefined | string
  >(undefined)
  const { id = `-1` } = useParams<ScreenParams>()
  const book = useEnrichedBookState({
    bookId: id,
    normalizedBookDownloadsState: useSignalValue(booksDownloadStateSignal),
    protectedTagIds: useProtectedTagIds().data,
    tags: useTagsByIds().data
  })
  const metadata = useMedataFromBook(book)
  const openBookActionDrawer = useBookActionDrawer({
    onDeleteBook: () => {
      goBack()
    }
  })

  if (isDebugEnabled()) {
    Report.info(`BookDetailsScreen`, { book })
  }

  return (
    <Stack
      style={{
        flex: 1,
        overflow: "auto"
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
          mt: 2
        }}
      >
        <CoverPane bookId={book?._id} />
        <Stack
          sx={{
            alignItems: ["center", "flex-start"],
            flexFlow: "column",
            justifyContent: ["center", "flex-start"],
            pt: [0, 5]
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
          width: "100%"
        }}
      >
        {book?.downloadState === "none" && (
          <Button
            variant="outlined"
            color="primary"
            sx={{
              flex: [1, "none"],
              minWidth: 260
            }}
            startIcon={<CloudDownloadRounded />}
            onClick={() => downloadFile(book)}
          >
            Download
          </Button>
        )}
        {book?.downloadState === "downloading" && (
          <Button
            sx={{
              flex: [1, "none"],
              minWidth: 260
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
              minWidth: 260
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
              actionsBlackList: ["goToDetails"]
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
      <LinkActionsDrawer
        openWith={isLinkActionDrawerOpenWith}
        bookId={book?._id}
        onClose={() => setIsLinkActionDrawerOpenWith(undefined)}
      />
    </Stack>
  )
})

const LinkActionsDrawer: FC<{
  openWith: string | undefined
  bookId: string | undefined
  onClose: () => void
}> = ({ openWith, onClose, bookId }) => {
  const [isEditDialogOpenWith, setIsEditDialogOpenWith] = useState<
    string | undefined
  >(undefined)

  return (
    <>
      <Drawer anchor="bottom" open={!!openWith} onClose={onClose}>
        <List>
          <ListItem
            button
            onClick={() => {
              setIsEditDialogOpenWith(openWith)
            }}
          >
            <ListItemIcon>
              <EditRounded />
            </ListItemIcon>
            <ListItemText primary="Edit the location" />
          </ListItem>
        </List>
      </Drawer>
      <EditLinkDialog
        openWith={isEditDialogOpenWith}
        onClose={() => setIsEditDialogOpenWith(undefined)}
      />
    </>
  )
}

const EditLinkDialog: FC<{
  openWith: string | undefined
  onClose: () => void
}> = ({ onClose, openWith }) => {
  const [location, setLocation] = useState("")
  const { data: link } = useLink({ id: openWith || "-1" })
  const editLink = useEditLink()

  const onInnerClose = () => {
    setLocation("")
    onClose()
  }

  useEffect(() => {
    setLocation((prev) => link?.resourceId || prev)
  }, [link, openWith])

  return (
    <Dialog onClose={onInnerClose} open={!!openWith}>
      <DialogTitle>Link edit</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          id="name"
          label="Name"
          type="text"
          fullWidth
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onInnerClose} color="primary">
          Cancel
        </Button>
        <Button
          onClick={() => {
            onInnerClose()
            link &&
              editLink({
                _id: link._id,
                resourceId: location
              })
          }}
          color="primary"
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}
