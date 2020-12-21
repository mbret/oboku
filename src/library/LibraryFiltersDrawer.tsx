import React, { useState, FC } from 'react';
import Dialog from '@material-ui/core/Dialog';
import { DialogTitle, Drawer, List, ListItem, ListItemText, ListItemIcon, DialogActions, Button } from '@material-ui/core';
import { ArrowForwardIosRounded, CheckCircleRounded, RadioButtonUncheckedOutlined } from '@material-ui/icons';
import { getDisplayableReadingState, useToggleTag } from './helpers';
import { TagsSelectionList } from '../tags/TagsSelectionList';
import { useRecoilState, useRecoilValue } from 'recoil';
import { tagsAsArrayState } from '../tags/states';
import { libraryState } from './states';
import { ReadingStateState } from 'oboku-shared';

export const LibraryFiltersDrawer: FC<{
  open: boolean,
  onClose: () => void
}> = ({ open, onClose }) => {
  const [isTagsDialogOpened, setIsTagsDialogOpened] = useState(false)
  const [isReadingStateDialogOpened, setIsReadingStateDialogOpened] = useState(false)
  const tags = useRecoilValue(tagsAsArrayState)
  const library = useRecoilValue(libraryState)
  const selectedTags = library.tags
  const toggleTag = useToggleTag()

  return (
    <>
      <Drawer
        anchor="bottom"
        open={open}
        onClose={onClose}
        transitionDuration={0}
      >
        <div
          role="presentation"
        >
          <List>
            <ListItem
              button
              onClick={() => setIsTagsDialogOpened(true)}
            >
              <ListItemText primary="Tags" secondary={(selectedTags?.length || 0) > 0 ? 'You have selected tags' : 'Any'} />
              <ListItemIcon>
                <ArrowForwardIosRounded />
              </ListItemIcon>
            </ListItem>
            <ListItem
              button
              onClick={() => setIsReadingStateDialogOpened(true)}
            >
              <ListItemText
                primary="Reading state"
                secondary={(library.readingStates.length > 0)
                  ? library.readingStates.map(s => getDisplayableReadingState(s)).join(', ')
                  : 'Any'}
              />
              <ListItemIcon>
                <ArrowForwardIosRounded />
              </ListItemIcon>
            </ListItem>
          </List>
        </div>
      </Drawer >
      <Dialog
        onClose={() => setIsTagsDialogOpened(false)}
        aria-labelledby="simple-dialog-title"
        open={isTagsDialogOpened}
      >
        <DialogTitle>Tags selection</DialogTitle>
        {tags && (
          <TagsSelectionList
            tags={tags}
            isSelected={tagId => !!library.tags?.find(item => item === tagId)}
            onItemClick={tagId => {
              toggleTag(tagId)
            }}
          />
        )}
        <DialogActions>
          <Button onClick={() => setIsTagsDialogOpened(false)} color="primary" autoFocus>
            Save
          </Button>
        </DialogActions>
      </Dialog>
      <ReadingStateDialog open={isReadingStateDialogOpened} onClose={() => setIsReadingStateDialogOpened(false)} />
    </>
  );
}

const ReadingStateDialog: FC<{ open: boolean, onClose: () => void }> = ({ open, onClose }) => {
  const [library, setLibrary] = useRecoilState(libraryState)

  const readingStates = [ReadingStateState.NotStarted, ReadingStateState.Reading, ReadingStateState.Finished]

  return (
    <Dialog
      onClose={onClose}
      aria-labelledby="simple-dialog-title"
      open={open}
    >
      <DialogTitle>Reading state</DialogTitle>
      {readingStates.map((readingState) => (
        <ListItem
          button
          key={readingState}
          onClick={() => {
            if (library.readingStates.includes(readingState)) {
              setLibrary(old => ({ ...old, readingStates: old.readingStates.filter(s => s !== readingState) }))
            } else {
              setLibrary(old => ({ ...old, readingStates: [...old.readingStates, readingState] }))
            }
          }}
        >
          <ListItemText primary={getDisplayableReadingState(readingState)} />
          {library.readingStates.includes(readingState)
            ? <CheckCircleRounded />
            : <RadioButtonUncheckedOutlined />}
        </ListItem>
      ))}
      <DialogActions>
        <Button onClick={onClose} color="primary" autoFocus>
          Ok
        </Button>
      </DialogActions>
    </Dialog>
  )
}