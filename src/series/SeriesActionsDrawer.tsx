import { Drawer, ListItem, Divider, List, ListItemIcon, ListItemText, DialogContent, DialogTitle, Dialog, TextField, DialogActions, Button } from "@material-ui/core";
import React, { useEffect, useState, FC } from "react";
import { useLazyQueryGetOneSeries, useRemoveSeries, useEditSeries } from "./queries";
import { Edit, DeleteForeverRounded } from "@material-ui/icons";

export const SeriesActionsDrawer: FC<{
  open: boolean,
  id: string | undefined,
  onClose: () => void,
}> = ({ open, id, onClose }) => {
  const [isEditSeriesDialogOpenedWithId, setIsEditSeriesDialogOpenedWithId] = useState<string | undefined>(undefined)
  const [getOneSeries, { data }] = useLazyQueryGetOneSeries()
  const removeSeries = useRemoveSeries()

  const handleClose = () => {
    onClose()
  };

  const onRemove = (id: string | undefined) => {
    handleClose()
    id && removeSeries(id)
  }

  const onEdit = (id: string | undefined) => {
    handleClose()
    id && setIsEditSeriesDialogOpenedWithId(id)
  }

  useEffect(() => {
    id && getOneSeries({
      variables: { id },
    })
  }, [id, getOneSeries])

  console.log('[ActionDialog]', data)

  return (
    <>
      <Drawer
        anchor="bottom"
        open={open}
        onClose={handleClose}
      >
        <div
          role="presentation"
        >
          <List>
            <ListItem button onClick={() => onEdit(id)}>
              <ListItemIcon><Edit /></ListItemIcon>
              <ListItemText primary="Edit" />
            </ListItem>
          </List>
          <Divider />
          <List>
            <ListItem button onClick={() => onRemove(id)}>
              <ListItemIcon><DeleteForeverRounded /></ListItemIcon>
              <ListItemText primary="Remove" />
            </ListItem>
          </List>
        </div>
      </Drawer>
      <EditSeriesDialog
        id={isEditSeriesDialogOpenedWithId}
        onClose={() => setIsEditSeriesDialogOpenedWithId(undefined)}
        open={!!isEditSeriesDialogOpenedWithId}
      />
    </>
  );
}


const EditSeriesDialog: FC<{
  open: boolean,
  id: string | undefined,
  onClose: () => void,
}> = ({ onClose, open, id }) => {
  const [name, setName] = useState('')
  const [getTag, { data }] = useLazyQueryGetOneSeries()
  const editSeries = useEditSeries()
  const { name: seriesName } = data?.oneSeries || {}

  const onInnerClose = () => {
    setName('')
    onClose()
  }

  const onConfirm = (id: string, name: string) => {
    if (name) {
      editSeries(id, name)
    }
  }

  useEffect(() => {
    id && getTag({ variables: { id } })
  }, [id, getTag])

  useEffect(() => {
    setName(prev => seriesName || prev)
  }, [seriesName, id])

  console.log('EditSeriesDialog', id, seriesName, data)

  return (
    <Dialog onClose={onInnerClose} open={open}>
      <DialogTitle>Series: {seriesName}</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          id="name"
          label="Name"
          type="text"
          fullWidth
          value={name}
          onChange={e => setName(e.target.value)}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onInnerClose} color="primary">
          Cancel
        </Button>
        <Button
          onClick={() => {
            onInnerClose()
            id && onConfirm(id, name)
          }}
          color="primary"
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}