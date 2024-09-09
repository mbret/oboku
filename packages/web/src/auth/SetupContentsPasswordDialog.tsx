import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  TextField,
  DialogActions,
  Button
} from "@mui/material"
import { useEffect, memo } from "react"
import { useUpdateContentPassword, useSettings } from "../settings/helpers"
import { PreventAutocompleteFields } from "../common/forms/PreventAutocompleteFields"
import { Controller, useForm } from "react-hook-form"
import { errorToHelperText } from "../common/forms/errorToHelperText"

const FORM_ID = "SetupContentsPasswordDialogForm"

type Inputs = {
  appPassword: string
}

export const SetupContentsPasswordDialog = memo(
  ({ onClose, open }: { open: boolean; onClose: () => void }) => {
    const { data: accountSettings } = useSettings()
    const { control, handleSubmit, setFocus, reset } =
      useForm<Inputs>({
        defaultValues: {
          appPassword: ""
        }
      })
    const hasPassword = !!accountSettings?.contentPassword
    const updatePassword = useUpdateContentPassword()

    const onInnerClose = () => {
      onClose()
    }

    useEffect(() => {
      reset()

      if (open) {
        setTimeout(() => {
          setFocus("appPassword")
        })
      }
    }, [open, reset, setFocus])

    return (
      <Dialog onClose={onInnerClose} open={open}>
        <DialogTitle>
          {hasPassword ? `Change` : `Initialize`} app password
        </DialogTitle>
        <DialogContent>
          <form
            noValidate
            autoComplete="off"
            id={FORM_ID}
            onSubmit={handleSubmit((data) => {
              updatePassword(data.appPassword)
              onInnerClose()
            })}
          >
            <DialogContentText mb={2}>
              This password will be required in order to proceed with sensitive
              tasks.
            </DialogContentText>
            <PreventAutocompleteFields />
            <Controller
              name="appPassword"
              control={control}
              rules={{ required: true, minLength: 4 }}
              render={({ field: { ref, ...rest }, fieldState }) => {
                return (
                  <TextField
                    {...rest}
                    label="Password"
                    type="password"
                    autoComplete="new-password"
                    fullWidth
                    margin="normal"
                    inputRef={ref}
                    error={fieldState.invalid}
                    helperText={errorToHelperText(fieldState.error)}
                  />
                )
              }}
            />
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={onInnerClose} color="primary">
            Cancel
          </Button>
          <Button color="primary" type="submit" form={FORM_ID}>
            {hasPassword ? `Change` : `Initialize`}
          </Button>
        </DialogActions>
      </Dialog>
    )
  }
)
