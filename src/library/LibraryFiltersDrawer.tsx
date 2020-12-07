import React, { useState, FC } from 'react';
import Dialog from '@material-ui/core/Dialog';
import { DialogTitle, makeStyles, createStyles, Drawer, List, ListItem, ListItemText, ListItemIcon, DialogActions, Button } from '@material-ui/core';
import { ArrowForwardIosRounded } from '@material-ui/icons';
import { useLibraryBooksSettings, useToggleTag } from './queries';
import { TagsSelectionList } from '../tags/TagsSelectionList';
import { useRecoilValue } from 'recoil';
import { tagsAsArrayState } from '../tags/states';

export const LibraryFiltersDrawer: FC<{
  open: boolean,
  onClose: () => void
}> = ({ open, onClose }) => {
  const [isTagsDialogOpened, setIsTagsDialogOpened] = useState(false)
  const tags = useRecoilValue(tagsAsArrayState)
  const { data: libraryFiltersData, error, called } = useLibraryBooksSettings()
  const libraryBooksSettings = libraryFiltersData?.libraryBooksSettings
  const selectedTags = libraryBooksSettings?.tags
  const toggleTag = useToggleTag()

  console.log('LibraryFiltersDrawer', libraryFiltersData, called, error)

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
            isSelected={tagId => !!libraryFiltersData?.libraryBooksSettings?.tags?.find(item => item?.id === tagId)}
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
    </>
  );
}

const useStyles = makeStyles((theme) =>
  createStyles({
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      flex: 1,
    },
    menuButton: {
      marginRight: theme.spacing(2),
    },
    title: {
      flexGrow: 1,
    },
  }),
);