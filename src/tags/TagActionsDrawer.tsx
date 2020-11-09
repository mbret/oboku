import React, { useState, FC, useEffect } from 'react';
import Dialog from '@material-ui/core/Dialog';
import {
  DialogTitle, Drawer, List, ListItem,
  ListItemText, ListItemIcon, DialogActions, Button, Divider, DialogContent, TextField
} from '@material-ui/core';
import { CheckCircleRounded, DeleteForeverRounded, EditRounded, RadioButtonUncheckedOutlined } from '@material-ui/icons';
import { useRemoveTag, useLazyQueryGetTag, useEditTag } from '../tags/queries';

export const TagActionsDrawer: FC<{
  openWith: string | undefined,
  onClose: () => void
}> = ({ openWith, onClose }) => {
  const [getTag, { data }] = useLazyQueryGetTag()
  const editTag = useEditTag()
  const [isEditTagDialogOpenedWithId, setIsEditTagDialogOpenedWithId] = useState<string | undefined>(undefined)
  const removeTag = useRemoveTag()
  const tag = data?.tag

  useEffect(() => {
    openWith && getTag({ variables: { id: openWith } })
  }, [openWith, getTag])

  console.log('[TagActionsDrawer]', tag)

  return (
    <>
      <Drawer
        anchor="bottom"
        open={!!openWith}
        onClose={onClose}
        transitionDuration={0}
      >
        <List>
          <ListItem
            button
            onClick={() => setIsEditTagDialogOpenedWithId(openWith)}
          >
            <ListItemIcon>
              <EditRounded />
            </ListItemIcon>
            <ListItemText primary="Rename" />
          </ListItem>
          <ListItem
            button
            onClick={() => openWith && editTag({ id: openWith, isProtected: !tag?.isProtected})}
          >
            <ListItemIcon>
              {!tag?.isProtected && (<RadioButtonUncheckedOutlined />)}
              {tag?.isProtected && (<CheckCircleRounded />)}
            </ListItemIcon>
            <ListItemText primary="Mark this tag as protected" secondary="This will lock and hide books behind it. Use unlock features to display them" />
          </ListItem>
        </List>
        <Divider />
        <List>
          <ListItem
            button
            onClick={() => {
              onClose()
              openWith && removeTag(openWith)
            }}
          >
            <ListItemIcon>
              <DeleteForeverRounded />
            </ListItemIcon>
            <ListItemText primary="Remove" />
          </ListItem>
        </List>
      </Drawer >
      <EditTagDialog
        id={isEditTagDialogOpenedWithId}
        onClose={() => {
          setIsEditTagDialogOpenedWithId(undefined)
          onClose()
        }}
        open={!!isEditTagDialogOpenedWithId}
      />
    </>
  );
}

const EditTagDialog: FC<{
  open: boolean,
  id: string | undefined,
  onClose: () => void,
}> = ({ onClose, open, id }) => {
  const [name, setName] = useState('')
  const [getTag, { data }] = useLazyQueryGetTag()
  const editTag = useEditTag()
  const { name: tagName } = data?.tag || {}

  const onInnerClose = () => {
    setName('')
    onClose()
  }

  const onConfirm = (id: string, name: string) => {
    if (name) {
      editTag({ id, name })
    }
  }

  useEffect(() => {
    id && getTag({ variables: { id } })
  }, [id, getTag])

  useEffect(() => {
    setName(prev => tagName || prev)
  }, [tagName, id])

  console.log('EditTagDialog', id, tagName, data)

  return (
    <Dialog onClose={onInnerClose} open={open}>
      <DialogTitle>Tag: {tagName}</DialogTitle>
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

// const useClasses = makeStyles((theme) =>
//   createStyles({

//   }),
// );