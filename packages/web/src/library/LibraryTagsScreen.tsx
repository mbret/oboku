import React, { useState, FC, useEffect } from 'react';
import Dialog from '@material-ui/core/Dialog';
import { Button, DialogActions, DialogContent, DialogTitle, TextField, Toolbar, ListItem, ListItemText, List, ListItemIcon } from '@material-ui/core';
import { useCreateTag } from '../tags/helpers';
import { TagActionsDrawer } from '../tags/TagActionsDrawer';
import { BlurOnRounded, LocalOfferRounded, LockRounded } from '@material-ui/icons';
import { LockActionDialog } from '../auth/LockActionDialog';
import { tagsAsArrayState } from '../tags/states';
import { useRecoilValue, useSetRecoilState } from 'recoil';
import { isTagsTourOpenedState, firstTimeExperienceState } from '../firstTimeExperience/firstTimeExperienceStates';
import { useCSS } from '../utils';

export const LibraryTagsScreen = () => {
  const [lockedAction, setLockedAction] = useState<(() => void) | undefined>(undefined)
  const classes = useStyles();
  const [isAddTagDialogOpened, setIsAddTagDialogOpened] = useState(false)
  const setIsTagsTourOpenedState = useSetRecoilState(isTagsTourOpenedState)
  const { hasDoneFirstTimeTags } = useRecoilValue(firstTimeExperienceState)
  const [isTagActionsDrawerOpenedWith, setIsTagActionsDrawerOpenedWith] = useState<string | undefined>(undefined)
  const tags = useRecoilValue(tagsAsArrayState)
  const [addTag] = useCreateTag()

  useEffect(() => {
    !hasDoneFirstTimeTags && setIsTagsTourOpenedState(true)
  }, [setIsTagsTourOpenedState, hasDoneFirstTimeTags])

  return (
    <div style={classes.container}>
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
      <List style={classes.list}>
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
            {tag?.isBlurEnabled && <BlurOnRounded color="primary" />}
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

const useStyles = () => {
  return useCSS(() => ({
    container: {
      flex: 1,
      overflow: 'auto'
    },
    list: {
    },
  }), [])
}