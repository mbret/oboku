import React from 'react';
import { TopBarNavigation } from '../TopBarNavigation';
import { ListItem, List, ListItemText, LinearProgress, ListItemIcon, Typography, Box } from '@material-ui/core';
import { StorageRounded } from '@material-ui/icons';
import { useStorageUse } from './useStorageUse';
import { LibraryViewMode } from '../rxdb';
import { BookList } from '../books/bookList/BookList';
import { useRecoilState, useRecoilValue } from 'recoil';
import { downloadedBookIdsState } from '../books/states';
import { bookActionDrawerState } from '../books/BookActionsDrawer';
import { bookDownloadsSizeState } from '../download/states';
import { bytesToMb } from '../utils';

export const ManageStorageScreen = () => {
  const books = useRecoilValue(downloadedBookIdsState)
  const { quotaUsed, quotaInGb, usedInMb } = useStorageUse([books])
  const [, setBookActionDrawerState] = useRecoilState(bookActionDrawerState)
  const bookSize = useRecoilValue(bookDownloadsSizeState)

  return (
    <>
      <TopBarNavigation title={'Manage storage'} />
      <List>
        <ListItem>
          <ListItemIcon>
            <StorageRounded />
          </ListItemIcon>
          <ListItemText
            primary="Available storage"
            disableTypography
            secondary={
              <div>
                <Box marginY={1}><LinearProgress variant="determinate" value={quotaUsed * 100} /></Box>
                <Typography gutterBottom variant="body2">{`${usedInMb} MB used of ${quotaInGb} GB (${(quotaUsed * 100).toFixed(2)}%)`}</Typography>
                <Typography variant="body2" color="textSecondary"><b>{bytesToMb(bookSize)} MB used by books</b></Typography>
              </div>
            }
          />
        </ListItem>
      </List>
      {books?.length > 0 && (
        <BookList
          viewMode={LibraryViewMode.LIST}
          data={books}
          density="dense"
          withDrawerActions={false}
          style={{
            height: '100%',
            overflow: 'hidden'
          }}
          onItemClick={(id) => setBookActionDrawerState({ openedWith: id, actions: ['removeDownload'] })}
        />
      )}
    </>
  );
}