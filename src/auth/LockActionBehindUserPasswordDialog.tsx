import { useLazyQuery, useQuery } from '@apollo/client';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField } from '@material-ui/core'
import React, { FC, useEffect, useState } from 'react'
import { QueryAuthorizeDocument, QueryUserDocument } from '../generated/graphql';

export const LockActionBehindUserPasswordDialog: FC<{
  action?: () => void
}> = ({ action }) => {
  const [open, setOpen] = useState(false)
  const [success, setSuccess] = useState(false)
  const [text, setText] = useState('')
  const { data: userData } = useQuery(QueryUserDocument)
  const [authorize] = useLazyQuery(QueryAuthorizeDocument, {
    fetchPolicy: 'network-only',
    onCompleted: (data) => {
      setSuccess(data?.authorize?.success || false)
    }
  })

  const onClose = () => {
    setOpen(false)
  }

  const onConfirm = () => {
    authorize({ variables: { password: text } })
  }

  useEffect(() => {
    if (success) {
      onClose()
      action && action()
    }
  }, [success, action])

  useEffect(() => {
    setSuccess(false)
    setText('')
  }, [open])

  useEffect(() => {
    if (action) {
      setOpen(true)
    }
  }, [action])

  return (
    <Dialog onClose={onClose} open={open}>
      <DialogTitle>Please enter your account password to continue</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Make sure you are online to proceed since we need to authorize you with the server
        </DialogContentText>
        <form>
          <input type="text" name="email" value={userData?.user?.email || ''} autoComplete="email" style={{ display: 'none' }} readOnly />
          <TextField
            autoFocus
            id="name"
            label="Password"
            type="password"
            fullWidth
            value={text}
            autoComplete="current-password"
            onChange={e => setText(e.target.value)}
          />
        </form>
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