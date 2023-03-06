import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField
} from "@mui/material"
import { crypto } from "@oboku/shared"
import { FC, useEffect } from "react"
import { atom, useRecoilState, useRecoilValue } from "recoil"
import { settingsState } from "../settings/states"
import { Controller, SubmitHandler, useForm } from "react-hook-form"
import { errorToHelperText } from "../common/forms/errorToHelperText"
import { PreventAutocompleteFields } from "../common/forms/PreventAutocompleteFields"
import { useModalNavigationControl } from "../navigation/useModalNavigationControl"
import { updateLibraryState } from "../library/states"

export const unlockLibraryDialogState = atom({
  key: "unlockLibraryDialog",
  default: false
})

type Inputs = {
  unlockPassword: string
}

const FORM_ID = "settings-unlock-library"

export const UnlockLibraryDialog: FC<{}> = () => {
  const { control, handleSubmit, setFocus, reset, setError } = useForm<Inputs>({
    defaultValues: {
      unlockPassword: ""
    }
  })
  const settings = useRecoilValue(settingsState)
  const [isOpened, setIsOpened] = useRecoilState(unlockLibraryDialogState)
  const contentPassword = settings?.contentPassword
  const { closeModalWithNavigation } = useModalNavigationControl(
    {
      onExit: () => {
        setIsOpened(false)
      }
    },
    isOpened
  )

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    const hashedPassword = crypto.hashContentPassword(data.unlockPassword)

    if (contentPassword === hashedPassword) {
      updateLibraryState({ isLibraryUnlocked: true })
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
  }, [isOpened, reset])

  useEffect(() => {
    if (isOpened) {
      setTimeout(() => {
        setFocus("unlockPassword")
      })
    }
  }, [setFocus, isOpened])

  return (
    <Dialog onClose={() => closeModalWithNavigation()} open={isOpened}>
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
