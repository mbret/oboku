import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField } from '@material-ui/core'
import { hashContentPassword } from 'oboku-shared';
import React, { FC, useEffect, useState } from 'react'
import { useRecoilValue } from 'recoil';
import { settingsState } from '../settings/states';

export const LockActionDialog: FC<{
  action?: () => void
}> = ({ action }) => {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const settings = useRecoilValue(settingsState)

  const onClose = () => {
    setOpen(false)
  }

  const onConfirm = async () => {
    const hashedPassword = await hashContentPassword(text)
    if (settings?.contentPassword === hashedPassword) {
      onClose()
      action && action()
    }
  }

  useEffect(() => {
    setText('')
  }, [open])

  useEffect(() => {
    if (action) {
      setOpen(true)
    }
  }, [action])

  return (
    <Dialog onClose={onClose} open={open}>
      <DialogTitle>Please enter your content password to continue</DialogTitle>
      <DialogContent>
        <DialogContentText>
          This is required because the action you want to perform involve your protected contents
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
          Continue
        </Button>
      </DialogActions>
    </Dialog>
  )
}