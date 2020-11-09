import React, { useEffect, useState } from 'react';
import { TopBarNavigation } from '../TopBarNavigation';
import { makeStyles, ListItem, List, ListItemText, ListItemAvatar, createStyles, Theme, LinearProgress, ListSubheader, ListItemIcon } from '@material-ui/core';
import { StorageRounded, MoreVert, SaveRounded } from '@material-ui/icons';
import { useStorageUse } from './useStorageUse';
import { useQueryGetBooks } from '../books/queries';

export const ManageStorageScreen = () => {
  const classes = useStyles();
  const { data: booksData } = useQueryGetBooks()
  const { quotaUsed, quotaInGb, usedInMb } = useStorageUse()

  return (
    <>
      <TopBarNavigation title={'Manage storage'} />
      <List className={classes.root}>
        <ListItem>
          <ListItemAvatar>
            <StorageRounded />
          </ListItemAvatar>
          <ListItemText
            primary="Available storage"
            secondary={
              <>
                <LinearProgress variant="determinate" value={quotaUsed * 100} />
                {`${usedInMb} MB (${(quotaUsed * 100).toFixed(2)}%) used of ${quotaInGb} GB`}
              </>
            }
          />
        </ListItem>
      </List>
      <List subheader={<ListSubheader>Downloaded books</ListSubheader>}>
        {booksData?.books?.books.map((book) => (
          <ListItem
            button
            onClick={() => { }}
          >
            <ListItemText primary={book?.title} secondary="0 MB"/>
            <ListItemIcon>
              <MoreVert />
            </ListItemIcon>
          </ListItem>
        ))}
      </List>
    </>
  );
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      // width: '100%',
      // maxWidth: 360,
      // backgroundColor: theme.palette.background.paper,
    },
  }),
);