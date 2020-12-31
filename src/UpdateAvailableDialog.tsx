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
      <DialogTitle >Yay! A new version is here</DialogTitle>
      <DialogContent>
        <DialogContentText>
          A new version of the app is available. To update you can click on "reload" button. (<b>This action is mandatory right now until release</b>)
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