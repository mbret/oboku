import { Drawer, ListItem, Divider, List, ListItemIcon, ListItemText, DialogContent, DialogTitle, Dialog, TextField, DialogActions, Button } from "@material-ui/core";
import React, { useEffect, useState, FC } from "react";
import { Edit, DeleteForeverRounded, DynamicFeedRounded } from "@material-ui/icons";
import { useRemoveCollection, useUpdateCollection } from "./helpers";
import { useRecoilValue } from "recoil";
import { collectionState } from "./states";
import { BooksSelectionDialog } from "./BooksSelectionDialog";

export const CollectionActionsDrawer: FC<{
  open: boolean,
  id: string,
  onClose: () => void,
  onRemove?: () => void,
}> = ({ open, id, onClose, onRemove }) => {
  const [isEditCollectionDialogOpenedWithId, setIsEditCollectionDialogOpenedWithId] = useState<string | undefined>(undefined)
  const [removeCollection] = useRemoveCollection()
  const [isBookDialogOpened, setIsBookDialogOpened] = useState(false)
  const [openDrawer, setOpenDrawer] = useState(false)

  useEffect(() => {
    setOpenDrawer(open)
  }, [open])

  const handleClose = () => {
    onClose()
  };

  const onRemoveCollection = (id: string | undefined) => {
    handleClose()
    onRemove && onRemove()
    id && removeCollection({ _id: id })
  }

  return (
    <>
      <Drawer
        anchor="bottom"
        open={openDrawer}
        onClose={handleClose}
      >
        <div
          role="presentation"
        >
          <List>
            <ListItem button onClick={() => {
              setOpenDrawer(false)
              setIsEditCollectionDialogOpenedWithId(id)
            }}>
              <ListItemIcon><Edit /></ListItemIcon>
              <ListItemText primary="Rename" />
            </ListItem>
          </List>
          <List>
            <ListItem button onClick={() => {
              setOpenDrawer(false)
              setIsBookDialogOpened(true)
            }}>
              <ListItemIcon><DynamicFeedRounded /></ListItemIcon>
              <ListItemText primary="Add or Remove books" />
            </ListItem>
          </List>
          <Divider />
          <List>
            <ListItem button onClick={() => onRemoveCollection(id)}>
              <ListItemIcon><DeleteForeverRounded /></ListItemIcon>
              <ListItemText primary="Remove" />
            </ListItem>
          </List>
        </div>
      </Drawer>
      <BooksSelectionDialog
        open={isBookDialogOpened}
        onClose={() => {
          setIsBookDialogOpened(false)
          handleClose()
        }}
        collectionId={id}
      />
      <EditCollectionDialog
        id={isEditCollectionDialogOpenedWithId}
        onClose={() => {
          setIsEditCollectionDialogOpenedWithId(undefined)
          handleClose()
        }}
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
  const collection = useRecoilValue(collectionState(id || '-1'))
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