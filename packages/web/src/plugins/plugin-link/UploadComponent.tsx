import { useState } from "react"
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Typography
} from "@mui/material"
import { TYPE, UNIQUE_RESOURCE_IDENTIFIER } from "./constants"
import { ObokuPlugin } from "../plugin-front"
import { generateResourceId } from "@oboku/shared"
import { object, string } from "yup"

const schema = object().shape({
  bookUrl: string().url().required()
})

export const UploadComponent: ObokuPlugin["UploadComponent"] = ({
  onClose,
  title
}) => {
  const [bookUrl, setBookUrl] = useState("")
  const isValid = schema.isValidSync({ bookUrl })
  const filename = bookUrl.substring(bookUrl.lastIndexOf("/") + 1) || "unknown"

  const handleConfirm = () => {
    setBookUrl("")
    onClose({
      book: {
        title: filename
      },
      link: {
        resourceId: generateResourceId(UNIQUE_RESOURCE_IDENTIFIER, bookUrl),
        type: TYPE
      }
    })
  }

  return (
    <Dialog open fullScreen>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          <Typography gutterBottom>
            oboku <b>does not</b> store any file on its own. Adding a book means
            creating a new book reference with one or several links. A link is
            the location where your file is stored. At the moment oboku only
            support <b>direct download</b> and <b>google drive public link</b>.
          </Typography>
          <b>Here are some examples: </b>
          <Typography noWrap>https://my_nas_url.com/file/45646578</Typography>
          <Typography noWrap>
            https://drive.google.com/file/d/1kGGQnvm...
          </Typography>
        </DialogContentText>
        <TextField
          autoFocus
          id="bookUrl"
          label="Your file url"
          type="text"
          fullWidth
          value={bookUrl}
          margin="normal"
          onChange={(e) => setBookUrl(e.target.value)}
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
