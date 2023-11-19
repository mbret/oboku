import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField
} from "@mui/material"
import { crypto } from "@oboku/shared"
import { FC, useEffect, useState } from "react"
import { useAccountSettings } from "../settings/helpers"

export const LockActionDialog: FC<{
  action?: () => void
}> = ({ action }) => {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState("")
  const { data: accountSettings } = useAccountSettings()

  const onClose = () => {
    setOpen(false)
  }

  const onConfirm = async () => {
    const hashedPassword = await crypto.hashContentPassword(text)
    if (accountSettings?.contentPassword === hashedPassword) {
      onClose()
      action && action()
    }
  }

  useEffect(() => {
    setText("")
  }, [open])

  useEffect(() => {
    if (action) {
      setOpen(true)
    }
  }, [action])

  return (
    <Dialog onClose={onClose} open={open}>
      <DialogTitle>Please enter your content password to continue</DialogTitle>
      <DialogContent>
        <DialogContentText>
          This is required because the action you want to perform involve your
          protected contents
        </DialogContentText>
        <TextField
          autoFocus
          id="name"
          label="Content password"
          type="password"
          fullWidth
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button onClick={onConfirm} color="primary">
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  )
}
