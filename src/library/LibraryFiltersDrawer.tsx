import React, { useState, FC, useEffect } from 'react';
import { gql, useMutation, useQuery, useReactiveVar, useApolloClient } from '@apollo/client';
import Dialog from '@material-ui/core/Dialog';
import { DialogTitle, makeStyles, createStyles, Drawer, List, ListItem, ListItemText, ListItemIcon, ListItemAvatar, DialogActions, Button } from '@material-ui/core';
import { ArrowForwardIosRounded, RadioButtonUncheckedOutlined, CheckCircleRounded } from '@material-ui/icons';
import { useQueryGetTags } from '../tags/queries';
import { useLibraryBooksSettings, useToggleTag } from './queries';


export const LibraryFiltersDrawer: FC<{
  open: boolean,
  onClose: () => void
}> = ({ open, onClose }) => {
  const [isTagsDialogOpened, setIsTagsDialogOpened] = useState(false)
  const { data } = useQueryGetTags()
  const { data: libraryFiltersData, error, called } = useLibraryBooksSettings()
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
              <ListItemText primary="Tags" secondary="Any" />
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
        <List>
          {data?.tags.map((tag) => (
            <ListItem
              key={tag?.id}
              button
              onClick={() => {
                tag?.id && toggleTag(tag?.id)
              }}
            >
              <ListItemAvatar>
                {libraryFiltersData?.libraryBooksSettings?.tags?.find(item => item?.id === tag?.id)
                  ? <CheckCircleRounded />
                  : <RadioButtonUncheckedOutlined />}
              </ListItemAvatar>
              <ListItemText primary={tag?.name} />
            </ListItem>
          ))}
        </List>
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