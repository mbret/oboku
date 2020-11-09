import React, { useState, FC } from 'react';
import '../App.css';
import Dialog from '@material-ui/core/Dialog';
import { Button, DialogActions, DialogContent, DialogTitle, TextField, Toolbar, makeStyles, createStyles, ListItem, ListItemText, List, ListItemIcon } from '@material-ui/core';
import { useQueryGetTags, useCreateTag } from '../tags/queries';
import { TagActionsDrawer } from '../tags/TagActionsDrawer';
import { EditRounded, LocalOfferRounded, LockRounded } from '@material-ui/icons';

export const LibraryTagsScreen = () => {
  const classes = useStyles();
  const [isAddTagDialogOpened, setIsAddTagDialogOpened] = useState(false)
  const [isTagActionsDrawerOpenedWith, setIsTagActionsDrawerOpenedWith] = useState<string | undefined>(undefined)
  const { data } = useQueryGetTags()
  const tags = data?.tags
  const addTag = useCreateTag()

  console.log('LibraryTagsScreen', tags)

  return (
    <div className={classes.container}>
      <Toolbar>
        <Button
          style={{
            width: '100%'
          }}
          variant="outlined"
          disableFocusRipple
          disableRipple
          onClick={() => setIsAddTagDialogOpened(true)}
        >
          Create a new tag
        </Button>
      </Toolbar>
      <List className={classes.list}>
        {tags && tags.map(tag => (
          <ListItem
            button
            key={tag.id}
            onClick={() => setIsTagActionsDrawerOpenedWith(tag.id)}
          >
            <ListItemIcon>
              <LocalOfferRounded />
            </ListItemIcon>
            <ListItemText primary={tag.name} secondary={`${tag.books?.length || 0} book(s)`} />
            {tag.isProtected && <LockRounded color="primary" />}
          </ListItem>
        ))}
      </List>
      <AddTagDialog
        onConfirm={(name) => {
          if (name) {
            addTag(name)
          }
        }}
        onClose={() => setIsAddTagDialogOpened(false)}
        open={isAddTagDialogOpened}
      />
      <TagActionsDrawer
        openWith={isTagActionsDrawerOpenedWith}
        onClose={() => setIsTagActionsDrawerOpenedWith(undefined)}
      />
    </div>
  );
}

const AddTagDialog: FC<{
  open: boolean,
  onConfirm: (name: string) => void,
  onClose: () => void,
}> = ({ onClose, onConfirm, open }) => {
  const [name, setName] = useState('')
  const onInnerClose = () => {
    setName('')
    onClose()
  }

  return (
    <Dialog onClose={onInnerClose} open={open}>
      <DialogTitle>Create a new tag</DialogTitle>
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
            onConfirm(name)
          }}
          color="primary"
        >
          Add
        </Button>
      </DialogActions>
    </Dialog>
  )
}

const useStyles = makeStyles((theme) =>
  createStyles({
    container: {
      flex: 1,
      overflow: 'auto'
    },
    list: {
    },
  }),
);