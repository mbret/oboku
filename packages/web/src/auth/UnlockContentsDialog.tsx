import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField
} from "@mui/material"
import { useEffect } from "react"
import { Controller, SubmitHandler, useForm } from "react-hook-form"
import { errorToHelperText } from "../common/forms/errorToHelperText"
import { PreventAutocompleteFields } from "../common/forms/PreventAutocompleteFields"
import { useModalNavigationControl } from "../navigation/useModalNavigationControl"
import { libraryStateSignal } from "../library/books/states"
import { useSettings } from "../settings/helpers"
import { hashContentPassword } from "../common/crypto"

type Inputs = {
  unlockPassword: string
}

const FORM_ID = "settings-unlock-library"

export const UnlockContentsDialog = ({
  onClose,
  open
}: {
  open: boolean
  onClose: () => void
}) => {
  const { control, handleSubmit, setFocus, reset, setError } = useForm<Inputs>({
    defaultValues: {
      unlockPassword: ""
    }
  })
  const { data: accountSettings } = useSettings()
  const contentPassword = accountSettings?.contentPassword
  const { closeModalWithNavigation } = useModalNavigationControl(
    {
      onExit: onClose
    },
    open
  )

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    const hashedPassword = await hashContentPassword(data.unlockPassword)

    if (contentPassword === hashedPassword) {
      libraryStateSignal.setValue((state) => ({
        ...state,
        isLibraryUnlocked: true
      }))

      closeModalWithNavigation()
    } else {
      setError(
        "unlockPassword",
        { message: "Wrong credential" },
        { shouldFocus: true }
      )
    }
  }

  useEffect(() => {
    reset()
  }, [open, reset])

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        setFocus("unlockPassword")
      })
    }
  }, [setFocus, open])

  return (
    <Dialog onClose={() => closeModalWithNavigation()} open={open}>
      <DialogTitle>Unlock library protected contents</DialogTitle>
      <DialogContent>
        {!!contentPassword && (
          <form id={FORM_ID} onSubmit={handleSubmit(onSubmit)}>
            <DialogContentText mb={2}>
              By entering your content password you will make every protected
              content visible. do not forget to lock it back when needed
            </DialogContentText>
            <PreventAutocompleteFields />
            <Controller
              name="unlockPassword"
              control={control}
              rules={{ required: true }}
              render={({ field: { ref, ...rest }, fieldState }) => {
                return (
                  <TextField
                    {...rest}
                    autoComplete="one-time-code"
                    label="Content password"
                    type="password"
                    fullWidth
                    inputRef={ref}
                    error={fieldState.invalid}
                    helperText={errorToHelperText(fieldState.error)}
                  />
                )
              }}
            />
          </form>
        )}
        {!contentPassword && (
          <DialogContentText>
            Before using this option you need to initialize your password
          </DialogContentText>
        )}
      </DialogContent>
      <DialogActions>
        {!!contentPassword && (
          <>
            <Button onClick={closeModalWithNavigation}>Cancel</Button>
            <Button type="submit" form={FORM_ID}>
              Unlock
            </Button>
          </>
        )}
        {!contentPassword && (
          <Button onClick={closeModalWithNavigation}>Ok</Button>
        )}
      </DialogActions>
    </Dialog>
  )
}
