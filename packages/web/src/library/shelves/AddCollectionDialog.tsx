import { useState, type FC } from "react"
import Dialog from "@mui/material/Dialog"
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material"
import { useCreateCollection } from "../../collections/useCreateCollection"

export const AddCollectionDialog: FC<{
  open: boolean
  onClose: () => void
}> = ({ onClose, open }) => {
  const [name, setName] = useState("")
  const { mutate: addCollection } = useCreateCollection()

  const onInnerClose = () => {
    setName("")
    onClose()
  }

  return (
    <Dialog onClose={onInnerClose} open={open}>
      <DialogTitle>Create a new collection</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          id="name"
          label="Name"
          type="text"
          fullWidth
          margin="normal"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onInnerClose} color="primary">
          Cancel
        </Button>
        <Button
          onClick={() => {
            onInnerClose()
            if (name) {
              addCollection({ name })
            }
          }}
          color="primary"
        >
          Add
        </Button>
      </DialogActions>
    </Dialog>
  )
}
