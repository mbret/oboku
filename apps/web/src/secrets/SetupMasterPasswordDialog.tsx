import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
} from "@mui/material"
import { useEffect, memo } from "react"
import { useSettings } from "../settings/useSettings"
import { PreventAutocompleteFields } from "../common/forms/PreventAutocompleteFields"
import { useForm } from "react-hook-form"
import { useUpdateMasterKey } from "./useUpdateMasterKey"
import { ErrorMessage, errorToMessage } from "../errors/ErrorMessage"
import { ControlledTextField } from "../common/forms/ControlledTextField"
import { useNotifications } from "../notifications/useNofitications"

const FORM_ID = "SetupContentsPasswordDialogForm"

type Inputs = {
  masterPassword: string
  currentPassword: string
}

export const SetupMasterPasswordDialog = memo(
  ({ onClose, open }: { open: boolean; onClose: () => void }) => {
    const { data: accountSettings } = useSettings()
    const {
      control,
      handleSubmit,
      setFocus,
      reset,
      setError,
      formState: { errors },
    } = useForm<Inputs>({
      defaultValues: {
        currentPassword: "",
        masterPassword: "",
      },
    })
    const hasPassword = !!accountSettings?.masterEncryptionKey
    const { mutate: updatePassword } = useUpdateMasterKey()
    const { notify } = useNotifications()

    const onInnerClose = () => {
      onClose()
    }

    useEffect(() => {
      reset()

      if (open) {
        setTimeout(() => {
          setFocus("currentPassword")
        })
      }
    }, [open, reset, setFocus])

    return (
      <Dialog onClose={onInnerClose} open={open} fullWidth maxWidth="sm">
        <DialogTitle>
          {hasPassword ? `Change` : `Initialize`} Master Password
        </DialogTitle>
        <DialogContent>
          <form
            noValidate
            autoComplete="off"
            id={FORM_ID}
            onSubmit={handleSubmit((data) => {
              updatePassword(
                {
                  newPassword: data.masterPassword,
                  oldPassword: data.currentPassword,
                },
                {
                  onSuccess: () => {
                    onInnerClose()
                    notify("actionSuccess")
                  },
                  onError: (error) => {
                    setError("root", {
                      message: errorToMessage(error),
                    })
                  },
                },
              )
            })}
          >
            <PreventAutocompleteFields />
            {hasPassword && (
              <ControlledTextField
                name="currentPassword"
                control={control}
                rules={{ required: true, minLength: 4 }}
                label="Current Password"
                type="password"
                autoComplete="current-password"
                fullWidth
                margin="normal"
              />
            )}
            <ControlledTextField
              name="masterPassword"
              control={control}
              rules={{ required: true, minLength: 4 }}
              label="Password"
              type="password"
              autoComplete="new-password"
              fullWidth
              margin="normal"
            />
            {!!errors.root && (
              <Alert severity="error">
                <ErrorMessage error={errors.root.message} />
              </Alert>
            )}
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={onInnerClose} variant="outlined">
            Cancel
          </Button>
          <Button variant="contained" type="submit" form={FORM_ID}>
            {hasPassword ? `Change` : `Initialize`}
          </Button>
        </DialogActions>
      </Dialog>
    )
  },
)
