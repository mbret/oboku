import { useQuery } from '@apollo/client'
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@material-ui/core'
import React, { FC } from 'react'
import { QueryAppHasUpdateAvailableDocument } from './generated/graphql'
import { useOfflineApolloClient } from './useOfflineApolloClient'

export const UpdateAvailableDialog: FC<{
  serviceWorker?: ServiceWorker
}> = ({ serviceWorker }) => {
  const client = useOfflineApolloClient()
  const { data } = useQuery(QueryAppHasUpdateAvailableDocument)

  console.log(`[UpdateAvailableDialog]`, data)

  return (
    <Dialog
      open={!!data?.app?.hasUpdateAvailable}
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