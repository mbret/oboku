import {
  DialogContent,
  DialogTitle,
  Dialog,
  TextField,
  DialogActions,
  Button
} from "@mui/material"
import { useEffect, useState, FC } from "react"
import { useCollection } from "../../../collections/states"
import { useUpdateCollection } from "../../../collections/useUpdateCollection"
import { getMetadataFromCollection } from "../../../collections/getMetadataFromCollection"

export const EditCollectionDialog: FC<{
  open: boolean
  id: string | undefined
  onClose: () => void
}> = ({ onClose, open, id }) => {
  const [name, setName] = useState("")
  const { data: collection } = useCollection({
    id
  })
  const { mutate: editCollection } = useUpdateCollection()

  const onInnerClose = () => {
    setName("")
    onClose()
  }

  const onConfirm = (id: string, name: string) => {
    if (name) {
      editCollection({ _id: id, name })
    }
  }

  const title = getMetadataFromCollection(collection)?.title

  useEffect(() => {
    setName((prev) => title || prev)
  }, [title, id])

  return (
    <Dialog onClose={onInnerClose} open={open}>
      <DialogTitle>{getMetadataFromCollection(collection)?.title}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          id="name"
          label="Name"
          type="text"
          margin="normal"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onInnerClose}>Cancel</Button>
        <Button
          onClick={() => {
            onInnerClose()
            id && onConfirm(id, name)
          }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}
