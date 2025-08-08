import {
  DialogContent,
  DialogTitle,
  Dialog,
  TextField,
  DialogActions,
  Button,
} from "@mui/material"
import { useEffect, useState, type FC } from "react"
import { getCollectionComputedMetadata } from "../getCollectionComputedMetadata"
import { useCollectionIncrementalModify } from "../useCollectionIncrementalModify"
import { useCollection } from "../useCollection"

export const RenameCollectionDialog: FC<{
  openWith: string | undefined
  onClose: () => void
}> = ({ onClose, openWith }) => {
  const [name, setName] = useState("")
  const { data: collection } = useCollection({
    id: openWith,
  })
  const { mutate: editCollection } = useCollectionIncrementalModify()

  const onInnerClose = () => {
    setName("")
    onClose()
  }

  const onConfirm = (id: string, name: string) => {
    if (name) {
      editCollection({ _id: id, name })
    }
  }

  const title = getCollectionComputedMetadata(collection)?.title

  useEffect(() => {
    void openWith

    setName((prev) => title || prev)
  }, [title, openWith])

  return (
    <Dialog onClose={onInnerClose} open={!!openWith}>
      <DialogTitle>{title}</DialogTitle>
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
            openWith && onConfirm(openWith, name)
          }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}
