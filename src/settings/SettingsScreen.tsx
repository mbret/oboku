import React, { FC, useEffect, useState } from 'react';
import { ArrowForwardIosRounded, LockOpenRounded, LockRounded } from '@material-ui/icons';
import { TopBarNavigation } from '../TopBarNavigation';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Link, List, ListItem, ListItemText, ListSubheader, TextField, Typography } from '@material-ui/core';
import { useHistory } from 'react-router-dom';
import { useStorageUse } from './useStorageUse';
import { unlockLibraryDialogState } from '../auth/UnlockLibraryDialog';
import { useResetFirstTimeExperience } from '../firstTimeExperience/helpers';
import { LoadLibraryFromJsonDialog } from '../debug/LoadLibraryFromJsonDialog';
import { LockActionBehindUserPasswordDialog } from '../auth/LockActionBehindUserPasswordDialog';
import { useSignOut } from '../auth/helpers';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { authState } from '../auth/authState';
import { settingsState } from './states';
import { useUpdateContentPassword } from './helpers';
import { libraryState } from '../library/states';

export const SettingsScreen = () => {
  const history = useHistory()
  const [lockedAction, setLockedAction] = useState<(() => void) | undefined>(undefined)
  const [isEditContentPasswordDialogOpened, setIsEditContentPasswordDialogOpened] = useState(false)
  const [isLoadLibraryDebugOpened, setIsLoadLibraryDebugOpened] = useState(false)
  const { quotaUsed, quotaInGb, usedInMb } = useStorageUse()
  const [, isUnlockLibraryDialogOpened] = useRecoilState(unlockLibraryDialogState)
  const auth = useRecoilValue(authState)
  const settings = useRecoilValue(settingsState)
  const library = useRecoilValue(libraryState)
  const signOut = useSignOut()
  const resetFirstTimeExperience = useResetFirstTimeExperience()
  const setLibraryState = useSetRecoilState(libraryState)

  return (
    <div style={{
      display: 'flex',
      flex: 1,
      overflow: 'scroll',
      flexFlow: 'column',
    }}>
      <TopBarNavigation title={'Settings'} showBack={false} />
      <List >
        <ListSubheader disableSticky>Account</ListSubheader>
        <ListItem
          button
          onClick={_ => signOut()}
        >
          <ListItemText primary="Sign out" secondary={auth?.email} />
        </ListItem>
        <ListItem
          button
          onClick={() => {
            if (settings?.contentPassword) {
              setLockedAction(_ => () => setIsEditContentPasswordDialogOpened(true))
            } else {
              setIsEditContentPasswordDialogOpened(true)
            }
          }}
        >
          <ListItemText primary="Protected contents password" secondary={settings?.contentPassword ? 'Change my password' : 'Initialize my password'} />
        </ListItem>
        <ListItem
          button
          onClick={() => {
            if (library?.isLibraryUnlocked) {
              setLibraryState(prev => ({ ...prev, isLibraryUnlocked: false }))
            } else {
              isUnlockLibraryDialogOpened(true)
            }
          }}
        >
          <ListItemText
            primary={library?.isLibraryUnlocked ? 'Protected contents are visible' : 'Protected contents are hidden'}
            secondary={library?.isLibraryUnlocked ? 'Click to lock' : 'Click to unlock'}
          />
          {library?.isLibraryUnlocked && (<LockOpenRounded color="action" />)}
          {!library?.isLibraryUnlocked && (<LockRounded color="action" />)}
        </ListItem>
      </List>
      <List subheader={<ListSubheader disableSticky>Storage</ListSubheader>}>
        <ListItem
          button
          onClick={() => {
            history.push('/settings/manage-storage')
          }}
        >
          <ListItemText primary="Manage storage" secondary={`${usedInMb} MB (${(quotaUsed * 100).toFixed(2)}%) used of ${quotaInGb} GB`} />
          <ArrowForwardIosRounded color="action" />
        </ListItem>
      </List>
      <List subheader={<ListSubheader disableSticky>Help and feedback</ListSubheader>}>
        <ListItem
          button
        >
          <ListItemText
            primary={(
              <Typography><Link target="__blank" href="https://docs.oboku.me/support">Support page</Link></Typography>
            )}
          />
        </ListItem>
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
      <LockActionBehindUserPasswordDialog action={lockedAction} />
      <EditContentPasswordDialog open={isEditContentPasswordDialogOpened} onClose={() => setIsEditContentPasswordDialogOpened(false)} />
    </div>
  );
}

const EditContentPasswordDialog: FC<{
  open: boolean,
  onClose: () => void,
}> = ({ onClose, open }) => {
  const updatePassword = useUpdateContentPassword()
  const settings = useRecoilValue(settingsState)
  const [text, setText] = useState('')
  const contentPassword = settings?.contentPassword || ''

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
          type="password"
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
          onClick={async () => {
            onInnerClose()
            updatePassword(text)
          }}
          color="primary"
        >
          Change
        </Button>
      </DialogActions>
    </Dialog>
  )
}