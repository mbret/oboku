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
import React, { FC, useEffect, useState } from "react"
import { atom, useRecoilState, useRecoilValue, useSetRecoilState } from "recoil"
import { libraryState } from "../library/states"
import { settingsState } from "../settings/states"

export const unlockLibraryDialogState = atom({
  key: "unlockLibraryDialog",
  default: false
})

const FORM_ID = "UnlockLibraryDialog"

export const UnlockLibraryDialog: FC<{}> = () => {
  const [text, setText] = useState("")
  const settings = useRecoilValue(settingsState)
  const [isOpened, setIsOpened] = useRecoilState(unlockLibraryDialogState)
  const setLibraryState = useSetRecoilState(libraryState)
  const contentPassword = settings?.contentPassword

  const onClose = () => {
    setIsOpened(false)
  }

  const onConfirm = async () => {
    const hashedPassword = await crypto.hashContentPassword(text)

    if (contentPassword === hashedPassword) {
      setLibraryState((prev) => ({ ...prev, isLibraryUnlocked: true }))
      onClose()
    }
  }

  useEffect(() => {
    setText("")
  }, [isOpened])

  return (
    <Dialog onClose={onClose} open={isOpened}>
      <DialogTitle>Unlock library protected contents</DialogTitle>
      <DialogContent>
        {!!contentPassword && (
          <form
            noValidate
            id={FORM_ID}
            autoComplete="off"
            onSubmit={(e) => e.preventDefault()}
          >
            <DialogContentText>
              By entering your content password you will make every protected
              content visible. do not forget to lock it back when needed
            </DialogContentText>
            <TextField
              autoFocus
              id="name"
              label="Content password"
              type="password"
              fullWidth
              value={text}
              onChange={(e) => setText(e.target.value)}
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
            <Button onClick={onClose} color="primary">
              Cancel
            </Button>
            <Button
              onClick={onConfirm}
              color="primary"
              type="submit"
              form={FORM_ID}
            >
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
