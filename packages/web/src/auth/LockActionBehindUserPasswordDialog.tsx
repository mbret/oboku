import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField
} from "@mui/material"
import { FC, useEffect, useState } from "react"
import { useAuthorize } from "./helpers"
import { useSignalValue } from "reactjrx"
import { authStateSignal } from "./authState"

const FORM_ID = "LockActionBehindUserPasswordDialog"

export const LockActionBehindUserPasswordDialog: FC<{
  action?: () => void
}> = ({ action }) => {
  const [open, setOpen] = useState(false)
  const [success, setSuccess] = useState(false)
  const [text, setText] = useState("")
  const auth = useSignalValue(authStateSignal)
  const authorize = useAuthorize()

  const onClose = () => {
    setOpen(false)
  }

  const onConfirm = () => {
    authorize({
      variables: { password: text },
      onSuccess: () => {
        setSuccess(true)
      }
    })
  }

  useEffect(() => {
    if (success) {
      onClose()
      action && action()
    }
  }, [success, action])

  useEffect(() => {
    setSuccess(false)
    setText("")
  }, [open])

  useEffect(() => {
    if (action) {
      setOpen(true)
    }
  }, [action])

  return (
    <Dialog onClose={onClose} open={open}>
      <DialogTitle>Please enter your account password to continue</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Make sure you are online to proceed since we need to authorize you
          with the server
        </DialogContentText>
        <form noValidate id={FORM_ID} onSubmit={(e) => e.preventDefault()}>
          <input
            type="text"
            name="email"
            value={auth?.email || ""}
            autoComplete="email"
            style={{ display: "none" }}
            readOnly
          />
          <TextField
            autoFocus
            id="name"
            label="Password"
            type="password"
            fullWidth
            value={text}
            autoComplete="current-password"
            onChange={(e) => setText(e.target.value)}
          />
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          color="primary"
          type="submit"
          form={FORM_ID}
        >
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  )
}
