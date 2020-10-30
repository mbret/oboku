import React from 'react';
import { createStyles, makeStyles, Theme } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import { ArrowBackIosRounded, Inbox, ArrowForwardIosRounded } from '@material-ui/icons';
import { TopBarNavigation } from '../TopBarNavigation';
import { List, ListItem, ListItemIcon, ListItemText } from '@material-ui/core';
import { useHistory } from 'react-router-dom';

export const SettingsScreen = () => {
  const history = useHistory()

  return (
    <div style={{
      flex: 1
    }}>
      <TopBarNavigation title={'Settings'} showBack={false} />
      <List component="nav" aria-label="main mailbox folders">
        <ListItem
          button
          onClick={() => {
            history.push('/settings/manage-storage')
          }}
        >
          <ListItemText primary="Manage storage" />
          <ListItemIcon>
            <ArrowForwardIosRounded />
          </ListItemIcon>
        </ListItem>
      </List>
    </div>
  );
}

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      flexGrow: 1,
    },
    menuButton: {
      marginRight: theme.spacing(2),
    },
    title: {
      flexGrow: 1,
    },
  }),
);