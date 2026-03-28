import { useState } from "react"
import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material"
import { TYPE } from "./constants"
import type { ObokuPlugin } from "../types"
import { generateUriResourceId } from "@oboku/shared"
import { string } from "zod"

const bookUrlSchema = string().url()

export const UploadBookComponent: ObokuPlugin<"URI">["UploadBookComponent"] = ({
  onClose,
  title,
}) => {
  const [bookUrl, setBookUrl] = useState("")
  const [allowSelfSigned, setAllowSelfSigned] = useState(false)
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down("md"))
  const isValid = bookUrlSchema.safeParse(bookUrl).success
  const filename = bookUrl.substring(bookUrl.lastIndexOf("/") + 1) || "unknown"

  const handleConfirm = () => {
    setBookUrl("")
    setAllowSelfSigned(false)
    onClose([
      {
        book: {
          title: filename,
        },
        link: {
          data: allowSelfSigned ? { allowSelfSigned: true } : {},
          resourceId: generateUriResourceId({ url: bookUrl }),
          type: TYPE,
        },
      },
    ])
  }

  return (
    <Dialog open fullScreen={fullScreen}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText
          gap={1}
          display="flex"
          flexDirection="column"
          component="div"
        >
          <Typography gutterBottom component="p">
            Make sure the resource allow <b>cross origin requests</b> (eg:
            Google Drive public link) otherwise oboku will not be able to access
            it. This solution is usually best suited when you have your own NAS
            or server.
          </Typography>
          <Typography fontWeight="bold">
            We recommend you to add books from datasource or a drive plugin
            (Google Drive, Dropbox, etc)
          </Typography>
          <Typography component="p">
            Here are some examples of valid URIs:
            <Stack component="span">
              <Typography noWrap component="span">
                - https://my_nas_url.com/file/45646578
              </Typography>
              <Typography noWrap component="span">
                - https://drive.google.com/file/d/1kGGQnvm...
              </Typography>
            </Stack>
          </Typography>
        </DialogContentText>
        <TextField
          autoFocus
          label="Your file url"
          type="text"
          fullWidth
          value={bookUrl}
          margin="normal"
          onChange={(e) => setBookUrl(e.target.value)}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={allowSelfSigned}
              onChange={(_, checked) => setAllowSelfSigned(checked)}
            />
          }
          label="Allow self-signed certificate for API requests"
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => onClose()} color="primary">
          Cancel
        </Button>
        <Button onClick={handleConfirm} color="primary" disabled={!isValid}>
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  )
}
