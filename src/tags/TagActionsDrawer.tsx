import React, { useState, FC, useEffect } from 'react';
import Dialog from '@material-ui/core/Dialog';
import {
  DialogTitle, Drawer, List, ListItem,
  ListItemText, ListItemIcon, DialogActions, Button, Divider, DialogContent, TextField
} from '@material-ui/core';
import { CheckCircleRounded, DeleteForeverRounded, EditRounded, RadioButtonUncheckedOutlined } from '@material-ui/icons';
import { useRemoveTag, useUpdateTag } from '../tags/helpers';
import { useRecoilValue } from 'recoil';
import { normalizedTagsState } from './states';

export const TagActionsDrawer: FC<{
  openWith: string | undefined,
  onClose: () => void
}> = ({ openWith, onClose }) => {
  const tag = useRecoilValue(normalizedTagsState)[openWith || '-1']
  const [editTag] = useUpdateTag()
  const [isEditTagDialogOpenedWithId, setIsEditTagDialogOpenedWithId] = useState<string | undefined>(undefined)
  const [removeTag] = useRemoveTag()

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
            onClick={() => openWith && editTag({ _id: openWith, isProtected: !tag?.isProtected })}
          >
            <ListItemIcon>
              {!tag?.isProtected && (<RadioButtonUncheckedOutlined />)}
              {tag?.isProtected && (<CheckCircleRounded />)}
            </ListItemIcon>
            <ListItemText primary="Mark this tag as protected" secondary="This will lock and hide books behind it. Use unlock features to display them" />
          </ListItem>
          <ListItem
            button
            onClick={() => openWith && editTag({ _id: openWith, isBlurEnabled: !tag?.isBlurEnabled })}
          >
            <ListItemIcon>
              {!tag?.isBlurEnabled && (<RadioButtonUncheckedOutlined />)}
              {tag?.isBlurEnabled && (<CheckCircleRounded />)}
            </ListItemIcon>
            <ListItemText primary="Blur covers" secondary="Apply a blur filter on book covers. Useful for sensitive content" />
          </ListItem>
        </List>
        <Divider />
        <List>
          <ListItem
            button
            onClick={() => {
              onClose()
              openWith && removeTag({ id: openWith })
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
  const { name: tagName } = useRecoilValue(normalizedTagsState)[id || '-1'] || {}
  const [editTag] = useUpdateTag()

  const onInnerClose = () => {
    setName('')
    onClose()
  }

  const onConfirm = (id: string, name: string) => {
    if (name) {
      editTag({ _id: id, name })
    }
  }

  useEffect(() => {
    setName(prev => tagName || prev)
  }, [tagName, id])

  console.log('EditTagDialog', id, tagName)

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