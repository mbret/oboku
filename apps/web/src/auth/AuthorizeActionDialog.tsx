import {
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
} from "@mui/material"
import { useEffect } from "react"
import { Controller, useForm } from "react-hook-form"
import { ControlledTextField } from "../common/forms/ControlledTextField"
import { signal, useMutation$, useSignalValue } from "reactjrx"
import { type Observable, from, map, mergeMap, of } from "rxjs"
import { getLatestDatabase } from "../rxdb/RxDbProvider"
import { getSettings } from "../settings/dbHelpers"
import { CancelError } from "../errors/errors.shared"
import { validateMasterKeyFn } from "../secrets/useValidateMasterKey"
import { useSettings } from "../settings/useSettings"
import { CancelButton } from "../common/forms/CancelButton"

const FORM_ID = "LockActionBehindUserPasswordDialog"

type Inputs = {
  password: string
  authorizeFor5Min: boolean
}

const TEMP_AUTH_DURATION_MINUTES = 5
const TEMP_AUTH_DURATION_MS = TEMP_AUTH_DURATION_MINUTES * 60 * 1000

let temporaryMasterKey: { key: string; expiresAt: number } | undefined

/** Clears the temporary master key (e.g. on sign-out). */
export const clearTemporaryMasterKey = () => {
  temporaryMasterKey = undefined
}

const actionSignal = signal<
  { action: (masterKey: string) => void; onCancel?: () => void } | undefined
>({})

export const authorizeAction = (
  action: (masterKey: string) => void,
  onCancel?: () => void,
) => {
  const temp = temporaryMasterKey
  if (temp && temp.expiresAt > Date.now()) {
    action(temp.key)
    return
  }
  actionSignal.update({
    action,
    onCancel,
  })
}

export const authorizeActionObservable = () => {
  const temp = temporaryMasterKey
  if (temp && temp.expiresAt > Date.now()) {
    return of(temp.key)
  }
  return from(
    new Promise<string>((resolve, reject) =>
      authorizeAction(resolve, () => reject(new CancelError())),
    ),
  )
}

export function useWithAuthorization() {
  return function withAuthorization<T>(stream: Observable<T>) {
    return stream.pipe(
      mergeMap((data) =>
        getLatestDatabase().pipe(
          mergeMap((db) => getSettings(db)),
          mergeMap((settings) =>
            settings?.masterEncryptionKey
              ? authorizeActionObservable().pipe(map(() => data))
              : of(data),
          ),
        ),
      ),
    )
  }
}

export const AuthorizeActionDialog = () => {
  // Reassigns module-scope state from inside the component.
  // TODO: move that state out of module scope, then drop this opt-out.
  "use no memo"

  const { action, onCancel = () => {} } = useSignalValue(actionSignal) ?? {}
  const open = !!action
  const { control, handleSubmit, setFocus, setError, reset } = useForm<Inputs>({
    defaultValues: {
      password: "",
      authorizeFor5Min: true,
    },
  })
  const settings = useSettings()
  const hasNotSetPassword = !settings.data?.masterEncryptionKey
  const { mutate: submitAuthorization, reset: resetSubmitMutation } =
    useMutation$({
      mutationFn: (input: { password: string; authorizeFor5Min: boolean }) =>
        validateMasterKeyFn(input.password),
      meta: { suppressGlobalErrorToast: true },
      onSuccess: (masterKey, variables) => {
        if (variables.authorizeFor5Min) {
          temporaryMasterKey = {
            key: masterKey,
            expiresAt: Date.now() + TEMP_AUTH_DURATION_MS,
          }
        }
        onClose()
        action?.(masterKey)
      },
      onError: () => {
        setError("password", {
          message: "Invalid",
        })
      },
    })

  const onClose = () => {
    actionSignal.update(undefined)
  }

  const _onCancel = () => {
    onCancel()
    onClose()
  }

  useEffect(() => {
    reset()
    resetSubmitMutation()

    if (open) {
      setTimeout(() => {
        setFocus("password")
      })
    }
  }, [open, resetSubmitMutation, reset, setFocus])

  return (
    <Dialog
      onClose={() => {
        _onCancel()
      }}
      open={open}
    >
      <DialogTitle>
        {hasNotSetPassword
          ? "Master Password required"
          : "Authorization required"}
      </DialogTitle>
      <DialogContent>
        <DialogContentText>
          {hasNotSetPassword
            ? "To continue with this action, please initialize your Master Password first"
            : "This action requires explicit authorization. Please enter your Master Password to continue."}
        </DialogContentText>
        {!hasNotSetPassword && (
          <form
            noValidate
            id={FORM_ID}
            onSubmit={handleSubmit((data) => {
              submitAuthorization({
                password: data.password,
                authorizeFor5Min: data.authorizeFor5Min,
              })
            })}
          >
            <ControlledTextField
              name="password"
              control={control}
              rules={{ required: true }}
              label="Password"
              type="password"
              fullWidth
              margin="normal"
              autoComplete="current-password"
            />
            <Controller
              name="authorizeFor5Min"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox checked={field.value} onChange={field.onChange} />
                  }
                  label={`Remember for ${TEMP_AUTH_DURATION_MINUTES} minutes`}
                />
              )}
            />
          </form>
        )}
      </DialogContent>
      <DialogActions>
        <CancelButton onClick={_onCancel} />
        {!hasNotSetPassword && (
          <Button
            color="primary"
            variant="contained"
            type="submit"
            form={FORM_ID}
          >
            Authorize
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}
