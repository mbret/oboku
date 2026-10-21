import { useState } from "react"
import Dialog from "@mui/material/Dialog"
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from "@mui/material"
import { signal, useSignalValue } from "reactjrx"
import { useCreateCollection } from "../../collections/useCreateCollection"
import { CancelButton } from "../../common/forms/CancelButton"

const addCollectionDialogSignal = signal<{ open: boolean }>({
  key: "addCollectionDialogState",
  default: { open: false },
})

export const openAddCollectionDialog = () => {
  addCollectionDialogSignal.setValue({ open: true })
}

const closeAddCollectionDialog = () => {
  addCollectionDialogSignal.setValue({ open: false })
}

export function AddCollectionDialog() {
  const { open } = useSignalValue(addCollectionDialogSignal)
  const [name, setName] = useState("")
  const { mutate: addCollection } = useCreateCollection()

  const onInnerClose = () => {
    setName("")
    closeAddCollectionDialog()
  }

  return (
    <Dialog onClose={onInnerClose} open={open}>
      <DialogTitle>Create a new collection</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          label="Name"
          type="text"
          fullWidth
          margin="normal"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <CancelButton onClick={onInnerClose} variant="outlined" />
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
