import { FC, useState } from "react"
import { useAddBook } from "../../books/helpers"
import { useDataSourceHelpers } from "../helpers"
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Typography
} from "@material-ui/core"
import * as yup from "yup"

const schema = yup.object().shape({
  bookUrl: yup.string().url().required()
})

export const UploadComponent: FC<{
  onClose: () => void
}> = ({ onClose }) => {
  const [addBook] = useAddBook()
  const { generateResourceId } = useDataSourceHelpers(`oboku-link`)
  const [bookUrl, setBookUrl] = useState(process.env.REACT_APP_HTTP_LINK || "")
  const isValid = schema.isValidSync({ bookUrl })
  const filename = bookUrl.substring(bookUrl.lastIndexOf("/") + 1) || "unknown"

  const handleConfirm = () => {
    setBookUrl("")
    addBook({
      book: {
        title: filename
      },
      link: {
        book: null,
        data: null,
        resourceId: generateResourceId(bookUrl),
        type: `URI`,
        createdAt: new Date().toISOString(),
        modifiedAt: null
      }
    })
    onClose()
  }

  return (
    <Dialog open fullScreen>
      <DialogTitle>Add a new book</DialogTitle>
      <DialogContent>
        <DialogContentText>
          <Typography gutterBottom>
            oboku <b>does not</b> store any file on its own. Adding a book means
            creating a new book reference with one or several links. A link is
            the location where your file is stored. At the moment oboku only
            support <b>direct download</b> and <b>google drive public link</b>
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
          onChange={(e) => setBookUrl(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button onClick={handleConfirm} color="primary" disabled={!isValid}>
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  )
}
