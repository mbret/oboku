import React, { useState, FC } from 'react';
import Dialog from '@material-ui/core/Dialog';
import { Button, DialogActions, DialogContent, DialogTitle, TextField, Toolbar, makeStyles, createStyles, ListItem, ListItemText, List, ListItemIcon } from '@material-ui/core';
import { useCreateTag } from '../tags/helpers';
import { TagActionsDrawer } from '../tags/TagActionsDrawer';
import { LocalOfferRounded, LockRounded } from '@material-ui/icons';
import { LockActionDialog } from '../auth/LockActionDialog';
import { tagsAsArrayState } from '../tags/states';
import { useRecoilValue } from 'recoil';

export const LibraryTagsScreen = () => {
  const [lockedAction, setLockedAction] = useState<(() => void) | undefined>(undefined)
  const classes = useStyles();
  const [isAddTagDialogOpened, setIsAddTagDialogOpened] = useState(false)
  const [isTagActionsDrawerOpenedWith, setIsTagActionsDrawerOpenedWith] = useState<string | undefined>(undefined)
  const tags = useRecoilValue(tagsAsArrayState)
  const [addTag] = useCreateTag()

  console.log('LibraryTagsScreen', tags?.map(tag => (tag as any)), lockedAction)

  return (
    <div className={classes.container}>
      <Toolbar>
        <Button
          style={{
            width: '100%'
          }}
          variant="outlined"
          color="primary"
          onClick={() => setIsAddTagDialogOpened(true)}
        >
          Create a new tag
        </Button>
      </Toolbar>
      <List className={classes.list}>
        {tags && tags.map(tag => (
          <ListItem
            button
            key={tag?._id}
            onClick={() => {
              const action = () => setIsTagActionsDrawerOpenedWith(tag?._id)
              if (tag?.isProtected) {
                setLockedAction(_ => action)
              } else {
                action()
              }
            }}
          >
            <ListItemIcon>
              <LocalOfferRounded />
            </ListItemIcon>
            <ListItemText
              primary={tag?.name}
              secondary={`${tag?.isProtected ? '?' : tag?.books?.length || 0} book(s)`}
            />
            {tag?.isProtected && <LockRounded color="primary" />}
          </ListItem>
        ))}
      </List>
      <AddTagDialog
        onConfirm={(name) => {
          if (name) {
            addTag({ name })
          }
        }}
        onClose={() => setIsAddTagDialogOpened(false)}
        open={isAddTagDialogOpened}
      />
      <LockActionDialog action={lockedAction} />
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