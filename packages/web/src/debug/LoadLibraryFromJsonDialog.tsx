import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField
} from "@mui/material"
import React, { FC, useEffect, useState } from "react"
import { useLoadLibraryFromJson } from "./useLoadLibraryFromJson"

export const LoadLibraryFromJsonDialog: FC<{
  open: boolean
  onClose: () => void
}> = ({ open, onClose }) => {
  const [json, setJson] = useState("")
  const loadFromJson = useLoadLibraryFromJson()

  const handleConfirm = () => {
    setJson("")
    loadFromJson(json)
    onClose()
  }

  useEffect(() => {
    setJson("")
  }, [open])

  return (
    <Dialog onClose={onClose} open={open} fullWidth>
      <DialogTitle>Copy paste JSON</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          id="json"
          label="json"
          type="text"
          fullWidth
          value={json}
          onChange={(e) => setJson(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button onClick={handleConfirm} color="primary">
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  )
}
