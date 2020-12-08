import { Drawer, ListItem, Divider, List, ListItemIcon, ListItemText, DialogContent, DialogTitle, Dialog, TextField, DialogActions, Button } from "@material-ui/core";
import React, { useEffect, useState, FC } from "react";
import { Edit, DeleteForeverRounded } from "@material-ui/icons";
import { useRemoveCollection, useUpdateCollection } from "./helpers";
import { useRecoilValue } from "recoil";
import { normalizedCollectionsState } from "./states";

export const CollectionActionsDrawer: FC<{
  open: boolean,
  id: string | undefined,
  onClose: () => void,
}> = ({ open, id, onClose }) => {
  const [isEditCollectionDialogOpenedWithId, setIsEditCollectionDialogOpenedWithId] = useState<string | undefined>(undefined)
  const [removeCollection] = useRemoveCollection()

  const handleClose = () => {
    onClose()
  };

  const onRemove = (id: string | undefined) => {
    handleClose()
    id && removeCollection({ id })
  }

  const onEdit = (id: string | undefined) => {
    handleClose()
    id && setIsEditCollectionDialogOpenedWithId(id)
  }

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
      <EditCollectionDialog
        id={isEditCollectionDialogOpenedWithId}
        onClose={() => setIsEditCollectionDialogOpenedWithId(undefined)}
        open={!!isEditCollectionDialogOpenedWithId}
      />
    </>
  );
}

const EditCollectionDialog: FC<{
  open: boolean,
  id: string | undefined,
  onClose: () => void,
}> = ({ onClose, open, id }) => {
  const [name, setName] = useState('')
  const collection = useRecoilValue(normalizedCollectionsState)[id || '-1']
  const [editCollection] = useUpdateCollection()

  const onInnerClose = () => {
    setName('')
    onClose()
  }

  const onConfirm = (id: string, name: string) => {
    if (name) {
      editCollection({ _id: id, name })
    }
  }

  useEffect(() => {
    setName(prev => collection?.name || prev)
  }, [collection?.name, id])

  return (
    <Dialog onClose={onInnerClose} open={open}>
      <DialogTitle>Collection: {collection?.name}</DialogTitle>
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