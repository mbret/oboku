import React, { useCallback } from 'react';
import { TopBarNavigation } from '../TopBarNavigation';
import { ListItem, List, ListItemText, LinearProgress, ListItemIcon, Typography, Box, useTheme, Button } from '@material-ui/core';
import { StorageRounded } from '@material-ui/icons';
import { useStorageUse } from './useStorageUse';
import { LibraryViewMode } from '../rxdb';
import { BookList } from '../books/bookList/BookList';
import { useRecoilState, useRecoilValue } from 'recoil';
import { downloadedBookIdsState } from '../books/states';
import { bookActionDrawerState } from '../books/BookActionsDrawer';
import { useCSS } from '../common/utils';
import { useDownloadedFilesInfo } from '../download/useDownloadedFilesInfo';
import { useRemoveDownloadFile } from '../download/useRemoveDownloadFile';
import { difference } from "ramda"
import Alert from '@material-ui/lab/Alert'
import { Report } from '../report';
import { useEffect } from 'react';

export const ManageStorageScreen = () => {
  const bookIds = useRecoilValue(downloadedBookIdsState)
  const { quotaUsed, quotaInGb, usedInMb } = useStorageUse([bookIds])
  const [, setBookActionDrawerState] = useRecoilState(bookActionDrawerState)
  const styles = useStyles()
  const removeDownloadFile = useRemoveDownloadFile()
  const { bookIds: downloadedBookIds, refetch } = useDownloadedFilesInfo()
  const extraDownloadFilesIds = difference(downloadedBookIds, bookIds)
  const theme = useTheme()

  const removeExtraBooks = useCallback(() => {
    Promise.all(extraDownloadFilesIds.map(id => removeDownloadFile(id)))
      .then(refetch)
      .catch(Report.error)
  }, [refetch, extraDownloadFilesIds, removeDownloadFile])

  useEffect(() => {
    refetch()
  }, [bookIds, refetch])

  return (
    <>
      <TopBarNavigation title={'Manage storage'} />
      <List style={styles.listHeader}>
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
                {/* <Typography variant="body2" color="textSecondary"><b>{bytesToMb(bookSize)} MB used by books</b></Typography> */}
              </div>
            }
          />
        </ListItem>
      </List>
      {extraDownloadFilesIds.length > 0 && (
        <Alert severity="warning" style={{ marginBottom: theme.spacing(0) }}>
          <div style={{ marginBottom: theme.spacing(1) }}>It seems that you have some extra downloaded files not linked to your current library.</div>
          <Button variant="outlined" color="secondary" onClick={removeExtraBooks}>Remove to free up space</Button>
        </Alert>
      )}
      <div style={styles.separator} />
      {bookIds?.length > 0 && (
        <BookList
          viewMode={LibraryViewMode.LIST}
          data={bookIds}
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

const useStyles = () => {
  const theme = useTheme()

  return useCSS(() => ({
    listHeader: {
      paddingBottom: 0,
    },
    separator: {
      width: `100%`,
      borderBottom: `1px solid ${theme.palette.grey[200]}`, boxSizing: 'border-box',
    }
  }), [theme])
}