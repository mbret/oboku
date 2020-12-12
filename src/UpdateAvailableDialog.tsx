import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@material-ui/core'
import React, { FC } from 'react'
import { atom } from 'recoil'

export const updateAvailableState = atom({
  key: 'updateAvailableState',
  default: false,
})

export const UpdateAvailableDialog: FC<{
  serviceWorker?: ServiceWorker
}> = ({ serviceWorker }) => {
  const hasUpdate = !!serviceWorker

  return (
    <Dialog
      open={hasUpdate}
    >
      <DialogTitle >An update is available</DialogTitle>
      <DialogContent>
        <DialogContentText>
          An update is available. Please reload the app to get the latest changes.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => {
          serviceWorker?.postMessage({ type: 'SKIP_WAITING' })
          window.location.reload()
        }} color="primary" autoFocus>
          Reload
        </Button>
      </DialogActions>
    </Dialog>
  )
}