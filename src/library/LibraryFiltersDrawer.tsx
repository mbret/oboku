import React, { useState, FC, useEffect } from 'react';
import { gql, useMutation, useQuery, useReactiveVar, useApolloClient } from '@apollo/client';
import Dialog from '@material-ui/core/Dialog';
import { DialogTitle, TextField, AppBar, Toolbar, IconButton, Typography, makeStyles, createStyles, Drawer, List, ListItem, ListItemText, ListItemIcon, ListItemAvatar, DialogActions, Button } from '@material-ui/core';
import { Menu, PublishRounded, TuneRounded, ArrowForwardIosRounded, RadioButtonUncheckedOutlined, CheckCircleRounded } from '@material-ui/icons';
import { useQueryGetLibraryFilters, useQueryGetTags, GET_LIBRARY_FILTERS, GET_TAG } from '../queries';


export const LibraryFiltersDrawer: FC<{
  open: boolean,
  onClose: () => void
}> = ({ open, onClose }) => {
  const [isTagsDialogOpened, setIsTagsDialogOpened] = useState(false)
  const { data } = useQueryGetTags()
  const { data: libraryFiltersData, error, called } = useQueryGetLibraryFilters()
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
                {libraryFiltersData?.libraryFilters?.tags?.find(item => item?.id === tag?.id)
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

const useToggleTag = () => {
  const client = useApolloClient()

  return async (tagId: string) => {
    try {
      const { libraryFilters } = client.readQuery({ query: GET_LIBRARY_FILTERS }) || {}
      const { data } = await client.query({ query: GET_TAG, variables: { id: tagId } })
      const tag = data?.tag

      let newTags
      if (libraryFilters?.tags.find(item => item?.id === tagId)) {
        newTags = libraryFilters?.tags.filter(item => item?.id !== tagId)
      } else {
        newTags = [...libraryFilters?.tags, tag]
      }

      client.writeQuery({
        query: GET_LIBRARY_FILTERS,
        data: { libraryFilters: { tags: newTags } }
      })
    } catch (e) {
      console.error(e)
    }
  }
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