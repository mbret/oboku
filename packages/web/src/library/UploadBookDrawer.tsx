import React, { useState, FC } from 'react';
import Dialog from '@material-ui/core/Dialog';
import { DialogTitle, Drawer, List, ListItem, ListItemText, DialogActions, Button, ListItemIcon } from '@material-ui/core';
import { CheckCircleRounded, RadioButtonUncheckedOutlined, SdStorageRounded } from '@material-ui/icons';
import { getDisplayableReadingState, useToggleTag } from './helpers';
import { TagsSelectionList } from '../tags/TagsSelectionList';
import { useRecoilState, useRecoilValue } from 'recoil';
import { tagsAsArrayState } from '../tags/states';
import { libraryState } from './states';
import { ReadingStateState } from '@oboku/shared';
import { useDataSourcePlugins } from '../dataSources/helpers';

export const UploadBookDrawer: FC<{
  open: boolean,
  onClose: (type?: 'device' | ReturnType<typeof useDataSourcePlugins>[number]['type'] | undefined) => void
}> = ({ open, onClose }) => {
  const [isTagsDialogOpened, setIsTagsDialogOpened] = useState(false)
  const [isReadingStateDialogOpened, setIsReadingStateDialogOpened] = useState(false)
  const tags = useRecoilValue(tagsAsArrayState)
  const library = useRecoilValue(libraryState)
  const toggleTag = useToggleTag()
  const dataSourcePlugins = useDataSourcePlugins()

  return (
    <>
      <Drawer
        anchor="bottom"
        open={open}
        onClose={() => onClose()}
        transitionDuration={0}
      >
        <div
          role="presentation"
        >
          <List>
            <ListItem
              button
              onClick={() => onClose('device')}
            >
              <ListItemIcon>
                <SdStorageRounded />
              </ListItemIcon>
              <ListItemText primary="From device" />
            </ListItem>
            {dataSourcePlugins.map(dataSource => (
              <ListItem
                button
                onClick={() => onClose(dataSource.type)}
                key={dataSource.type}
              >
                <ListItemIcon>
                  <dataSource.Icon />
                </ListItemIcon>
                <ListItemText primary={`From ${dataSource.name}`} />
              </ListItem>
            ))}
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