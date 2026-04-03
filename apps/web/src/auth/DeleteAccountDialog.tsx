import { type FC, memo, useEffect, useState } from "react"
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from "@mui/material"
import { useDeleteAccount } from "./useDeleteAccount"

const CONFIRMATION_PHRASE = "delete my account"

export const DeleteAccountDialog: FC<{
  open: boolean
  email: string
  onClose: () => void
}> = memo(function DeleteAccountDialog({ onClose, open, email }) {
  const [confirmationInput, setConfirmationInput] = useState("")
  const { mutate, isPending, isError } = useDeleteAccount()
  const isConfirmed =
    confirmationInput.trim().toLowerCase() === CONFIRMATION_PHRASE

  useEffect(() => {
    if (open) {
      setConfirmationInput("")
    }
  }, [open])

  return (
    <Dialog onClose={onClose} open={open}>
      <DialogTitle>Delete my account</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {`This will permanently delete your account (${email}) and all associated data including books, collections, tags, reading progress, and data source configurations. This action cannot be undone.`}
        </DialogContentText>
        <DialogContentText mt={2}>
          {`Type "${CONFIRMATION_PHRASE}" to confirm.`}
        </DialogContentText>
        <TextField
          autoFocus
          fullWidth
          margin="dense"
          value={confirmationInput}
          onChange={(e) => setConfirmationInput(e.target.value)}
          disabled={isPending}
          placeholder={CONFIRMATION_PHRASE}
        />
        {isError && (
          <DialogContentText color="error" mt={1}>
            Something went wrong. Please try again.
          </DialogContentText>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isPending}>
          Cancel
        </Button>
        <Button
          onClick={() => mutate()}
          color="error"
          disabled={!isConfirmed || isPending}
        >
          {isPending ? "Deleting..." : "Delete my account"}
        </Button>
      </DialogActions>
    </Dialog>
  )
})
