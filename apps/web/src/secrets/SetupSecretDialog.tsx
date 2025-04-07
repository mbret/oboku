import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Stack,
} from "@mui/material"
import { useEffect, memo, useState } from "react"
import { PreventAutocompleteFields } from "../common/forms/PreventAutocompleteFields"
import { useForm } from "react-hook-form"
import { ErrorMessage, errorToMessage } from "../errors/ErrorMessage"
import { ControlledTextField } from "../common/forms/ControlledTextField"
import { useNotifications } from "../notifications/useNofitications"
import { signal, SIGNAL_RESET, useMutation$, useSignalValue } from "reactjrx"
import { useInsertSecret } from "./useInsertSecret"
import { encryptSecret } from "./secretsUtils"
import { from, type Observable, of, switchMap } from "rxjs"
import { useSecret } from "./useSecret"
import { useUpdateSecret } from "./useUpdateSecret"
import { CancelButton } from "../common/forms/CancelButton"

export const setupSecretDialogSignal = signal<
  | {
      openWith: true
      masterKey: string
    }
  | {
      openWith: string
      masterKey?: string
    }
  | {
      openWith: false
      masterKey: undefined
    }
>({
  default: {
    openWith: false,
    masterKey: undefined,
  },
})

const FORM_ID = "SetupSecretDialogForm"

type FormValues = {
  name: string
  value: string
}

export const SetupSecretDialog = memo(() => {
  const { openWith, masterKey } = useSignalValue(setupSecretDialogSignal)
  const [closed, setClosed] = useState(false)
  const open = !!openWith
  const { data: secret, isPending } = useSecret(
    typeof openWith === "string" ? openWith : undefined,
  )
  const isAddingNewSecret = openWith === true
  const {
    control,
    handleSubmit,
    setFocus,
    reset,
    setError,
    formState: { errors, disabled },
  } = useForm<FormValues>({
    defaultValues: {
      name: "",
      value: "",
    },
    values: {
      name: secret?.name ?? "",
      value: "",
    },
    disabled: !isAddingNewSecret && isPending,
  })
  const { notify } = useNotifications()
  const { mutateAsync: insertSecret } = useInsertSecret()
  const { mutateAsync: updateSecret } = useUpdateSecret()
  const { mutateAsync: submit } = useMutation$({
    mutationFn: (data: FormValues) => {
      if (typeof openWith === "string") {
        const maybeEncryptedSecret$: Observable<{
          iv: string
          data: string
        } | null> =
          data.value !== "" && !!masterKey
            ? from(encryptSecret(data.value, masterKey))
            : of(null)

        return maybeEncryptedSecret$.pipe(
          switchMap((maybeEncryptedSecret) => {
            return from(
              updateSecret({
                name: data.name,
                ...(maybeEncryptedSecret && {
                  value: maybeEncryptedSecret,
                }),
                _id: openWith,
              }),
            )
          }),
        )
      }

      const encryptedSecret$ = from(encryptSecret(data.value, masterKey ?? ""))

      return encryptedSecret$.pipe(
        switchMap((encryptedSecret) => {
          return from(
            insertSecret({
              name: data.name,
              value: encryptedSecret,
            }),
          )
        }),
      )
    },
    onSuccess: () => {
      onInnerClose()
      notify("actionSuccess")
    },
    onError: (error) => {
      setError("root", {
        message: errorToMessage(error),
      })
    },
  })

  const onInnerClose = () => {
    setClosed(true)
  }

  useEffect(() => {
    void openWith

    setClosed(false)
    reset()
  }, [openWith, reset])

  return (
    <Dialog
      onClose={onInnerClose}
      open={open && !closed}
      fullWidth
      maxWidth="sm"
      onTransitionEnter={() => {
        setFocus("name")
      }}
      onTransitionExited={() => {
        if (closed) {
          setupSecretDialogSignal.update(SIGNAL_RESET)
        }
      }}
    >
      <DialogTitle>
        {isAddingNewSecret ? `Add a new secret` : `Update secret`}
      </DialogTitle>
      <DialogContent>
        <Stack
          component="form"
          noValidate
          autoComplete="off"
          id={FORM_ID}
          onSubmit={handleSubmit((value) => submit(value))}
          gap={2}
        >
          <PreventAutocompleteFields />
          <ControlledTextField
            name="name"
            control={control}
            rules={{ required: true }}
            label="Name"
            type="text"
            fullWidth
            sx={{ mt: 1 }}
          />
          <ControlledTextField
            name="value"
            control={control}
            rules={{ required: isAddingNewSecret }}
            label="Value"
            placeholder="***********"
            {...(!masterKey && { disabled: true })}
            type="password"
            fullWidth
            helperText={
              isAddingNewSecret
                ? ""
                : "Will be changed only if you provide a new value"
            }
          />
          {!!errors.root && (
            <Alert severity="error">
              <ErrorMessage error={errors.root.message} />
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <CancelButton onClick={onInnerClose} />
        <Button
          variant="contained"
          type="submit"
          form={FORM_ID}
          disabled={disabled}
        >
          {isAddingNewSecret ? `Add` : `Update`}
        </Button>
      </DialogActions>
    </Dialog>
  )
})
