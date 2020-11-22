import React from 'react';
import { List, ListItem, ListSubheader, Typography } from '@material-ui/core';
import { TopBarNavigation } from './TopBarNavigation';

export const FAQScreen = () => (
  <div style={{
    display: 'flex',
    flex: 1,
    overflow: 'scroll',
    flexFlow: 'column',
  }}>
    <TopBarNavigation title={'Freq. asked questions'} />
    <List subheader={<ListSubheader disableSticky>Data sources</ListSubheader>}>
      <ListItem>
        <Typography variant="body2">
          Data sources let you add an external location from which oboku can automatically add books.
          Let's take an example with Google Drive. Assuming you want to store your files in a folder
          on your drive. Rather than adding each book one by one by providing the public URL of each files, you
          can create a data source which target the folder where all your books are. Once the data source is created
          you can synchronize it which will automatically add any books present in the folder (minus the one already added)
        </Typography>
      </ListItem>
    </List>
  </div>
)