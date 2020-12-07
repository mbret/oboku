import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField } from '@material-ui/core'
import { hashContentPassword } from 'oboku-shared';
import React, { FC, useEffect, useState } from 'react'
import { atom, useRecoilState, useRecoilValue } from 'recoil';
import { useUpdateLibrary } from '../library/helpers';
import { settingsState } from '../settings/states';

export const unlockLibraryDialogState = atom({ key: 'unlockLibraryDialog', default: false })

export const UnlockLibraryDialog: FC<{}> = () => {

  const [text, setText] = useState('')
  const settings = useRecoilValue(settingsState)
  const [isOpened, setIsOpened] = useRecoilState(unlockLibraryDialogState);
  const [updateLibrary] = useUpdateLibrary()
  const contentPassword = settings?.contentPassword

  const onClose = () => {
    setIsOpened(false)
  }

  const onConfirm = async () => {
    const hashedPassword = await hashContentPassword(text)
    if (contentPassword === hashedPassword) {
      updateLibrary({ isLibraryUnlocked: true })
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
          type="password"
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