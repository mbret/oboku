import { makeVar, useReactiveVar } from '@apollo/client';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField } from '@material-ui/core'
import { hashContentPassword } from 'oboku-shared';
import React, { FC, useEffect, useState } from 'react'
import { useToggleContentProtection, useUser } from './queries';

export const isUnlockLibraryDialogOpened = makeVar(false);

export const UnlockLibraryDialog: FC<{}> = () => {

  const [text, setText] = useState('')
  const { data: userData } = useUser()
  const isOpened = useReactiveVar(isUnlockLibraryDialogOpened);
  const toggleContentProtection = useToggleContentProtection()
  const contentPassword = userData?.user?.contentPassword

  const onClose = () => {
    isUnlockLibraryDialogOpened(false)
  }

  const onConfirm = async () => {
    const hashedPassword = new TextDecoder().decode((await hashContentPassword(text)))
    if (contentPassword === hashedPassword) {
      toggleContentProtection()
      onClose()
    }
  }

  useEffect(() => {
    setText('')
  }, [isOpened])

  return (
    <Dialog onClose={onClose} open={isOpened}>
      <DialogTitle>Unlock library protected contents</DialogTitle>
      <DialogContent>
        <DialogContentText>
          By entering your content password you will make every protected content visible. do not forget to lock it back when needed
        </DialogContentText>
        <TextField
          autoFocus
          id="name"
          label="Content password"
          type="text"
          fullWidth
          value={text}
          onChange={e => setText(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
            </Button>
        <Button onClick={onConfirm} color="primary">
          Unlock
        </Button>
      </DialogActions>
    </Dialog>
  )
}