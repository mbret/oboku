import React, { useState, FC, useEffect, useRef } from 'react';
import { gql, useMutation, useQuery, useReactiveVar } from '@apollo/client';
import '../App.css';
import Dialog from '@material-ui/core/Dialog';
import { BookList } from './/BookList';
import { Button, DialogActions, DialogContent, DialogTitle, TextField, AppBar, Toolbar, IconButton, Typography, makeStyles, createStyles, Drawer, ListItem, ListItemIcon, Checkbox, ListItemText, ListItemSecondaryAction, List } from '@material-ui/core';
import { AddCircleRounded, DeleteForeverRounded } from '@material-ui/icons';
import { ADD_TAG, REMOVE_TAG, useQueryGetTags, useLazyQueryGetTag, EDIT_TAG } from '../queries';

export const LibraryTagsScreen = () => {
  const classes = useStyles();
  const [isAddTagDialogOpened, setIsAddTagDialogOpened] = useState(false)
  const [isEditTagDialogOpenedWithId, setIsEditTagDialogOpenedWithId] = useState<string | undefined>(undefined)
  const { data } = useQueryGetTags()
  const tags = data?.tags
  const [addTag] = useMutation(ADD_TAG, {
    update: (cache, { data }) => {
      cache.modify({
        fields: {
          books: (prev = [], { toReference, fieldName }) => {
            return [...prev, toReference(data?.addTag)]
          }
        }
      })
    }
  });
  const [removeTag] = useMutation(REMOVE_TAG, {
    update: (cache, { data }) => {
      const item = cache.identify(data?.removeTag)
      item && cache.evict({ id: item })
    }
  });
  const [editTag] = useMutation(EDIT_TAG)

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
            role={undefined}
            dense
            button
            key={tag.id}
            onClick={() => {
              setIsEditTagDialogOpenedWithId(tag?.id)
            }}
          >
            <ListItemText primary={tag.name} />
            <ListItemSecondaryAction
              onClick={() => {
                removeTag({ variables: { id: tag?.id } })
              }}
            >
              <IconButton
                edge="end"
              >
                <DeleteForeverRounded />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
      <EditTagDialog
        onConfirm={(id, name) => {
          if (name) {
            editTag({ variables: { id, name } })
          }
        }}
        id={isEditTagDialogOpenedWithId}
        onClose={() => setIsEditTagDialogOpenedWithId(undefined)}
        open={!!isEditTagDialogOpenedWithId}
      />
      <AddTagDialog
        onConfirm={(name) => {
          if (name) {
            addTag({ variables: { name } })
          }
        }}
        onClose={() => setIsAddTagDialogOpened(false)}
        open={isAddTagDialogOpened}
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
      <DialogTitle>Add a tag</DialogTitle>
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

const EditTagDialog: FC<{
  open: boolean,
  id: string | undefined,
  onConfirm: (id: string, name: string) => void,
  onClose: () => void,
}> = ({ onClose, onConfirm, open, id }) => {
  const [name, setName] = useState('')
  const [getTag, { data }] = useLazyQueryGetTag()
  const { name: tagName } = data?.tag || {}

  const onInnerClose = () => {
    setName('')
    onClose()
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