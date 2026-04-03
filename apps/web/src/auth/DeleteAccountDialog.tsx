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
import { useSignalValue } from "reactjrx"
import { authStateSignal } from "./states.web"
import { useDeleteAccount } from "./useDeleteAccount"
import { ReportProblemOutlined } from "@mui/icons-material"
import { CancelButton } from "../common/forms/CancelButton"

const CONFIRMATION_PHRASE = "delete my account"

export const DeleteAccountDialog: FC<{
  open: boolean
  onClose: () => void
}> = memo(function DeleteAccountDialog({ onClose, open }) {
  const auth = useSignalValue(authStateSignal)
  const email = auth?.email ?? ""
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
      <DialogTitle color="error" gap={1} display="flex" alignItems="center">
        <ReportProblemOutlined color="error" fontSize="large" />
        Delete my account
      </DialogTitle>
      <DialogContent>
        <DialogContentText color="error">
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
        <CancelButton onClick={onClose} disabled={isPending} />
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
