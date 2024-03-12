import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField
} from "@mui/material"
import { FC, useEffect } from "react"
import { useValidateAppPassword } from "../settings/helpers"
import { Controller, useForm } from "react-hook-form"
import { errorToHelperText } from "../common/forms/errorToHelperText"
import { signal, useSignalValue } from "reactjrx"

const FORM_ID = "LockActionBehindUserPasswordDialog"

type Inputs = {
  password: string
}

const actionSignal = signal<
  { action: () => void; onCancel?: () => void } | undefined
>({})

export const authorizeAction = (action: () => void, onCancel?: () => void) =>
  actionSignal.setValue({
    action,
    onCancel
  })

export const AuthorizeActionDialog: FC<{}> = () => {
  const { action, onCancel = () => {} } = useSignalValue(actionSignal) ?? {}
  const open = !!action
  const { control, handleSubmit, setFocus, setError, reset } = useForm<Inputs>({
    defaultValues: {
      password: ""
    }
  })
  const {
    mutate: validatePassword,
    reset: resetValidatePasswordMutation,
    error
  } = useValidateAppPassword({
    onSuccess: () => {
      onClose()
      action && action()
    },
    onError: () => {
      setError("password", {
        message: "Invalid"
      })
    }
  })

  const onClose = () => {
    actionSignal.setValue(undefined)
  }

  const _onCancel = () => {
    onCancel()
    onClose()
  }

  useEffect(() => {
    reset()
    resetValidatePasswordMutation()

    if (open) {
      setTimeout(() => {
        setFocus("password")
      })
    }
  }, [open, resetValidatePasswordMutation, reset, setFocus])

  return (
    <Dialog
      onClose={() => {
        _onCancel()
      }}
      open={open}
    >
      <DialogTitle>Authorization required</DialogTitle>
      <DialogContent>
        <DialogContentText>
          This action requires explicit authorization. Please enter your app
          password to continue.
        </DialogContentText>
        <form
          noValidate
          id={FORM_ID}
          onSubmit={handleSubmit((data) => {
            validatePassword(data.password)
          })}
        >
          <Controller
            name="password"
            control={control}
            rules={{ required: true }}
            render={({ field: { ref, ...rest }, fieldState }) => {
              return (
                <TextField
                  {...rest}
                  label="Password"
                  type="password"
                  fullWidth
                  margin="normal"
                  inputRef={ref}
                  autoComplete="current-password"
                  error={fieldState.invalid}
                  helperText={errorToHelperText(fieldState.error)}
                />
              )
            }}
          />
        </form>
      </DialogContent>
      <DialogActions>
        <Button onClick={_onCancel} color="primary">
          Cancel
        </Button>
        <Button color="primary" type="submit" form={FORM_ID}>
          Authorize
        </Button>
      </DialogActions>
    </Dialog>
  )
}
