import { FC, useState, useEffect } from "react"
import Button from "@mui/material/Button"
import { EditRounded } from "@mui/icons-material"
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
  useTheme,
  Box,
  Container,
  Stack
} from "@mui/material"
import { useNavigate, useParams } from "react-router-dom"
import { Alert } from "@mui/material"
import { useDownloadBook } from "../../download/useDownloadBook"
import { ROUTES } from "../../constants"
import { useEnrichedBookState } from "../states"
import { useLink } from "../../links/states"
import { useEditLink } from "../../links/helpers"
import { DataSourceSection } from "./DataSourceSection"
import { isDebugEnabled } from "../../debug/isDebugEnabled.shared"
import { useRemoveDownloadFile } from "../../download/useRemoveDownloadFile"
import { booksDownloadStateSignal } from "../../download/states"
import { useProtectedTagIds, useTagsByIds } from "../../tags/helpers"
import { useSignalValue } from "reactjrx"
import { getMetadataFromBook } from "../getMetadataFromBook"
import { MetadataSourcePane } from "./MetadataSourcePane"
import { CoverPane } from "./CoverPane"
import { MetadataPane } from "./MetadataPane"
import { DebugInfo } from "../../debug/DebugInfo"
import { useRefreshBookMetadata } from "../helpers"
import { CollectionsPane } from "./CollectionsPane"

type ScreenParams = {
  id: string
}

export const BookDetailsScreen = () => {
  const theme = useTheme()
  const navigate = useNavigate()
  const downloadFile = useDownloadBook()
  const refreshBookMetadata = useRefreshBookMetadata()
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
  const removeDownloadFile = useRemoveDownloadFile()

  const metadata = getMetadataFromBook(book)

  return (
    <Stack
      style={{
        flex: 1,
        overflow: "auto"
      }}
      gap={2}
    >
      <TopBarNavigation title="Book details" showBack={true} />
      <DebugInfo info={{ id: book?._id || ``, linkId: book?.links[0] ?? "" }} />
      {isDebugEnabled() && (
        <Button
          fullWidth
          variant="outlined"
          color="primary"
          onClick={() => {
            refreshBookMetadata(book?._id ?? "")
          }}
        >
          debug:refresh_metadata
        </Button>
      )}
      <CoverPane bookId={book?._id} mt={2} />
      <Container
        style={{
          display: "flex",
          alignItems: "center",
          flexFlow: "column",
          justifyContent: "center",
          textAlign: "center"
        }}
      >
        <Typography variant="body1">{metadata?.title || "Unknown"}</Typography>
        <Typography variant="body2" fontStyle="italic">
          By {metadata?.authors?.join(", ") || "Unknown"}
        </Typography>
      </Container>
      <Box
        marginBottom={1}
        flexDirection="column"
        style={{
          display: "flex",
          width: "100%",
          paddingLeft: theme.spacing(2),
          paddingRight: theme.spacing(2)
        }}
      >
        {book?.downloadState === "none" && (
          <Button
            fullWidth
            variant="outlined"
            color="primary"
            onClick={() => downloadFile(book)}
          >
            Download
          </Button>
        )}
        {book?.downloadState === "downloading" && (
          <Button fullWidth variant="outlined" color="primary" disabled>
            Downloading...
          </Button>
        )}
        {book?.downloadState === "downloaded" && (
          <Button
            fullWidth
            variant="outlined"
            color="primary"
            onClick={() => navigate(ROUTES.READER.replace(":id", book._id))}
          >
            Read
          </Button>
        )}
        {book?.downloadState === "downloaded" && (
          <Box mt={2}>
            <Button
              fullWidth
              variant="outlined"
              color="primary"
              onClick={() => removeDownloadFile(book._id)}
            >
              Remove the book download
            </Button>
          </Box>
        )}
      </Box>
      {book?.metadataUpdateStatus === "fetching" && (
        <Alert severity="info">
          We are still retrieving metadata information...
        </Alert>
      )}
      <Container>
        <MetadataPane bookId={book?._id} />
        <CollectionsPane bookId={book?._id} />
      </Container>
      <Stack>
        <MetadataSourcePane bookId={id} />
        <DataSourceSection bookId={id} />
      </Stack>
      <LinkActionsDrawer
        openWith={isLinkActionDrawerOpenWith}
        bookId={book?._id}
        onClose={() => setIsLinkActionDrawerOpenWith(undefined)}
      />
    </Stack>
  )
}

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
