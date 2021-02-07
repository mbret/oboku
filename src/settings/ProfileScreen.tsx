import React, { FC, useEffect, useState } from 'react';
import { GavelRounded, LockOpenRounded, LockRounded, SettingsRounded, StorageRounded } from '@material-ui/icons';
import { TopBarNavigation } from '../TopBarNavigation';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, fade, Link, List, ListItem, ListItemIcon, ListItemText, ListSubheader, TextField, Typography, useTheme } from '@material-ui/core';
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
import { version } from '../../package.json'
import { ROUTES } from '../constants';
import { useDialog } from '../dialog';

export const ProfileScreen = () => {
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
  const theme = useTheme()
  const dialog = useDialog()

  return (
    <Box display="flex" flex={1} overflow="scroll" flexDirection="column">
      <TopBarNavigation title={'Profile'} showBack={false} />
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
      <List subheader={<ListSubheader disableSticky>Settings & device</ListSubheader>}>
        <ListItem
          button
          onClick={() => {
            history.push(ROUTES.SETTINGS)
          }}
        >
          <ListItemIcon>
            <SettingsRounded />
          </ListItemIcon>
          <ListItemText primary="oboku settings" />
        </ListItem>
        <ListItem
          button
          onClick={() => {
            history.push(`${ROUTES.PROFILE}/manage-storage`)
          }}
        >
          <ListItemIcon>
            <StorageRounded />
          </ListItemIcon>
          <ListItemText primary="Manage storage" secondary={`${usedInMb} MB (${(quotaUsed * 100).toFixed(2)}%) used of ${quotaInGb} GB`} />
        </ListItem>
      </List>
      <List subheader={<ListSubheader disableSticky>Help and feedback</ListSubheader>}>
        <ListItem
          button
        >
          <ListItemText
            primary="Do you need any help?"
            secondary={(
              <Typography variant="body2" color="textSecondary">You can visit our <Link target="__blank" href="https://docs.oboku.me/support">support page</Link></Typography>
            )}
          />
        </ListItem>
        <ListItem
          button
        >
          <ListItemText
            primary="I have a request"
            secondary={(
              <Typography variant="body2" color="textSecondary">Whether it is a bug, a feature request or anything else, please visit the <Link target="__blank" href="https://docs.oboku.me">doc</Link> to find all useful links</Typography>
            )}
          />
        </ListItem>
        <ListItem
          button
          onClick={resetFirstTimeExperience}
        >
          <ListItemText
            primary="Restart the welcome tour"
            secondary="This will display all the first time tours overlay again. Useful for a quick reminder on how to use the app"
          />
        </ListItem>
      </List>
      <List subheader={<ListSubheader disableSticky>About</ListSubheader>}>
        <ListItem
          button
          onClick={() => dialog({ preset: 'NOT_IMPLEMENTED' })}
        >
          <ListItemIcon>
            <GavelRounded />
          </ListItemIcon>
          <ListItemText primary="Terms of Service" />
        </ListItem>
        <ListItem>
          <ListItemText primary="Version" secondary={version} />
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
      <List
        subheader={<ListSubheader disableSticky style={{ color: theme.palette.error.dark }}>Danger zone</ListSubheader>}
        style={{ backgroundColor: fade(theme.palette.error.light, 0.2) }}
      >
        <ListItem button onClick={() => dialog({ preset: 'NOT_IMPLEMENTED' })}>
          <ListItemText
            primary="Repair my account"
            secondary="If you start noticing problems with your data (missing items, sync, ...) you may try to repair your account using one of the options"
          />
        </ListItem>
        <ListItem button onClick={() => dialog({ preset: 'NOT_IMPLEMENTED' })}>
          <ListItemText primary="Delete my account" />
        </ListItem>
      </List>
      <LockActionBehindUserPasswordDialog action={lockedAction} />
      <EditContentPasswordDialog open={isEditContentPasswordDialogOpened} onClose={() => setIsEditContentPasswordDialogOpened(false)} />
    </Box>
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