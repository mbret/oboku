import React, { FC, useEffect, useState } from 'react';
import { ArrowForwardIosRounded, LockOpenRounded, LockRounded } from '@material-ui/icons';
import { TopBarNavigation } from '../TopBarNavigation';
import { Link, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, List, ListItem, ListItemIcon, ListItemText, ListSubheader, TextField } from '@material-ui/core';
import { useHistory } from 'react-router-dom';
// import { useStorageUse } from './useStorageUse';
import { useUser, useSignOut, useEditUser, useToggleContentProtection } from '../auth/queries';
import { isUnlockLibraryDialogOpened } from '../auth/UnlockLibraryDialog';
import { useResetFirstTimeExperience } from '../firstTimeExperience/queries';
import { LoadLibraryFromJsonDialog } from '../debug/LoadLibraryFromJsonDialog';
import { Alert } from '@material-ui/lab';
import { ROUTES } from '../constants';

export const DataSourcesScreen = () => {
  const history = useHistory()
  const [isEditContentPasswordDialogOpened, setIsEditContentPasswordDialogOpened] = useState(false)
  const [isLoadLibraryDebugOpened, setIsLoadLibraryDebugOpened] = useState(false)
  // const { quotaUsed, quotaInGb, usedInMb } = useStorageUse()
  const { data: userData } = useUser()
  const signOut = useSignOut()
  const resetFirstTimeExperience = useResetFirstTimeExperience()
  const toggleContentProtection = useToggleContentProtection()
  const isLibraryUnlocked = userData?.user.isLibraryUnlocked

  console.log(`[SettingsScreen]`, { userData })

  return (
    <div style={{
      display: 'flex',
      flex: 1,
      overflow: 'scroll',
      flexFlow: 'column',
    }}>
      <TopBarNavigation title={'Data sources'} showBack={false} />
      <Alert severity="info">Automatically add books from an external source (eg: Google Drive shared folder). <Link onClick={() => history.push(ROUTES.FAQ)}>Learn more</Link></Alert>
      <List >
        <ListSubheader disableSticky>Account</ListSubheader>
        <ListItem
          button
          onClick={signOut}
        >
          <ListItemText primary="Sign out" secondary={userData?.user.email} />
        </ListItem>
        <ListItem
          button
          onClick={() => setIsEditContentPasswordDialogOpened(true)}
        >
          <ListItemText primary="Set up content password" secondary={userData?.user.contentPassword ? 'Your password is set up' : 'You do not have set up any password yet'} />
        </ListItem>
        <ListItem
          button
          onClick={() => {
            if (isLibraryUnlocked) {
              toggleContentProtection()
            } else {
              isUnlockLibraryDialogOpened(true)
            }
          }}
        >
          <ListItemText
            primary={isLibraryUnlocked ? 'Your protected contents are visible' : 'Your protected contents are hidden'}
            secondary={isLibraryUnlocked ? 'Click to lock' : 'Click to unlock'}
          />
          {isLibraryUnlocked && (<LockOpenRounded color="action" />)}
          {!isLibraryUnlocked && (<LockRounded color="action" />)}
        </ListItem>
      </List>
      <List subheader={<ListSubheader disableSticky>Storage</ListSubheader>}>
        <ListItem
          button
          onClick={() => {
            history.push('/settings/manage-storage')
          }}
        >
          {/* <ListItemText primary="Manage storage" secondary={`${usedInMb} MB (${(quotaUsed * 100).toFixed(2)}%) used of ${quotaInGb} GB`} /> */}
          <ArrowForwardIosRounded color="action" />
        </ListItem>
      </List>
      <List subheader={<ListSubheader disableSticky>Help and feedback</ListSubheader>}>
        <ListItem
          button
          onClick={resetFirstTimeExperience}
        >
          <ListItemText primary="Restart the welcome tour" />
        </ListItem>
      </List>
      <List subheader={<ListSubheader disableSticky>About</ListSubheader>}>
        <ListItem
          button
          onClick={() => { }}
        >
          <ListItemText primary="Terms of Service" />
          <ArrowForwardIosRounded color="action" />
        </ListItem>
      </List>
      {process.env.NODE_ENV !== 'production' && (
        <>
          <List subheader={<ListSubheader disableSticky>Developer options</ListSubheader>}>
            <ListItem
              button
              onClick={() => setIsLoadLibraryDebugOpened(true)}
            >
              <ListItemText primary="Load library from JSON file" />
            </ListItem>
          </List>
          <LoadLibraryFromJsonDialog open={isLoadLibraryDebugOpened} onClose={() => setIsLoadLibraryDebugOpened(false)} />
        </>
      )}
      <EditContentPasswordDialog open={isEditContentPasswordDialogOpened} onClose={() => setIsEditContentPasswordDialogOpened(false)} />
    </div>
  );
}

const EditContentPasswordDialog: FC<{
  open: boolean,
  onClose: () => void,
}> = ({ onClose, open }) => {
  const editUser = useEditUser()
  const { data: userData } = useUser()
  const [text, setText] = useState('')
  const contentPassword = userData?.user.contentPassword || ''

  const onInnerClose = () => {
    onClose()
  }

  useEffect(() => {
    setText(contentPassword)
  }, [contentPassword])

  useEffect(() => {
    setText('')
  }, [open])

  return (
    <Dialog onClose={onInnerClose} open={open}>
      <DialogTitle>Set up your content password</DialogTitle>
      <DialogContent>
        <DialogContentText >
          This password will be needed to unlock and access books using a protected tag.
        </DialogContentText>
        <TextField
          autoFocus
          id="name"
          label="Password"
          type="text"
          fullWidth
          value={text}
          onChange={e => setText(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onInnerClose} color="primary">
          Cancel
        </Button>
        <Button
          onClick={() => {
            onInnerClose()
            editUser({ contentPassword: text })
          }}
          color="primary"
        >
          Change
        </Button>
      </DialogActions>
    </Dialog>
  )
}