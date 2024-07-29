import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  TextField,
  DialogActions,
  Button
} from "@mui/material"
import { useState, useEffect, memo } from "react"
import { useUpdateContentPassword, useSettings } from "../settings/helpers"
import { PreventAutocompleteFields } from "../common/forms/PreventAutocompleteFields"

export const SetupContentsPasswordDialog = memo(
  ({ onClose, open }: { open: boolean; onClose: () => void }) => {
    const { data: accountSettings } = useSettings()
    const hasPassword = !!accountSettings?.contentPassword
    const updatePassword = useUpdateContentPassword()
    const [text, setText] = useState("")

    const onInnerClose = () => {
      onClose()
    }

    useEffect(() => {
      setText("")
    }, [open])

    return (
      <Dialog onClose={onInnerClose} open={open}>
        <DialogTitle>
          {hasPassword ? `Change` : `Initialize`} app password
        </DialogTitle>
        <DialogContent>
          <form autoComplete="off" onSubmit={(e) => e.preventDefault()}>
            <DialogContentText mb={2}>
              This password will be required in order to proceed with sensitive
              tasks.
            </DialogContentText>
            <PreventAutocompleteFields />
            <TextField
              autoFocus
              autoComplete="one-time-code"
              label="Password"
              type="password"
              fullWidth
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={onInnerClose} color="primary">
            Cancel
          </Button>
          <Button
            onClick={async () => {
              if (text === "") return

              onInnerClose()
              updatePassword(text)
            }}
            color="primary"
          >
            {hasPassword ? `Change` : `Initialize`}
          </Button>
        </DialogActions>
      </Dialog>
    )
  }
)
