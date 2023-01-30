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
import { atom, useRecoilState, useRecoilValue, useSetRecoilState } from "recoil"
import { libraryState } from "../library/states"
import { settingsState } from "../settings/states"
import { Controller, SubmitHandler, useForm } from "react-hook-form"
import { errorToHelperText } from "../common/forms/errorToHelperText"
import { PreventAutocompleteFields } from "../common/forms/PreventAutocompleteFields"

export const unlockLibraryDialogState = atom({
  key: "unlockLibraryDialog",
  default: false
})

type Inputs = {
  unlockPassword: string
}

const FORM_ID = "settings-unlock-library"

export const UnlockLibraryDialog: FC<{}> = () => {
  const { control, handleSubmit, setFocus, reset, setError, formState } =
    useForm<Inputs>({
      defaultValues: {
        unlockPassword: ""
      }
    })
  const settings = useRecoilValue(settingsState)
  const [isOpened, setIsOpened] = useRecoilState(unlockLibraryDialogState)
  const setLibraryState = useSetRecoilState(libraryState)
  const contentPassword = settings?.contentPassword

  const onClose = () => {
    setIsOpened(false)
  }

  const onSubmit: SubmitHandler<Inputs> = async (data) => {
    const hashedPassword = crypto.hashContentPassword(data.unlockPassword)

    if (contentPassword === hashedPassword) {
      setLibraryState((prev) => ({ ...prev, isLibraryUnlocked: true }))
      onClose()
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
    <Dialog onClose={onClose} open={isOpened}>
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
                console.log({ fieldState })
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
            <Button onClick={onClose}>Cancel</Button>
            <Button type="submit" form={FORM_ID}>
              Unlock
            </Button>
          </>
        )}
        {!contentPassword && (
          <Button onClick={onClose} color="primary" type="submit">
            Ok
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}
