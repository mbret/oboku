import React, { useState } from 'react';
import { TopBarNavigation } from '../TopBarNavigation';
import { Link, Button, Toolbar, List, ListItem, ListItemText, SvgIcon, ListItemIcon, Typography, Box, useTheme } from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import { DataSourcesAddDrawer } from './DataSourcesAddDrawer';
import { GoogleDriveDataSource } from './google/GoogleDriveDataSource';
import { ReactComponent as GoogleDriveAsset } from '../assets/google-drive.svg';
import { DataSourcesActionsDrawer } from './DataSourcesActionsDrawer';
import { dataSourcesAsArrayState } from './states';
import { useRecoilValue } from 'recoil';
import { Error } from '@material-ui/icons';
import { extractDataSourceData } from 'oboku-shared';

export const DataSourcesScreen = () => {
  const [isDrawerOpened, setIsDrawerOpened] = useState(false)
  const [isGoogleDriveOpened, setIsGoogleDriveOpened] = useState(false)
  const [isActionsDrawerOpenWith, setIsActionsDrawerOpenWith] = useState<string | undefined>(undefined)
  const dataSources = useRecoilValue(dataSourcesAsArrayState)
  const theme = useTheme()

  return (
    <>
      <div style={{
        display: 'flex',
        flex: 1,
        overflow: 'scroll',
        flexFlow: 'column',
      }}>
        <TopBarNavigation title={'Data sources'} showBack={false} />
        <Alert severity="info">
          Automatically add books from an external source (eg: Google Drive shared folder). <Link href="https://docs.oboku.me" target="__blank">Learn more</Link>
        </Alert>
        <Toolbar>
          <Button
            style={{
              width: '100%'
            }}
            variant="outlined"
            color="primary"
            onClick={() => setIsDrawerOpened(true)}
          >
            Add a new source
        </Button>
        </Toolbar>
        <List>
          {dataSources?.map(item => (
            <ListItem key={item._id} button onClick={() => setIsActionsDrawerOpenWith(item._id)}>
              <ListItemIcon>
                <SvgIcon >
                  <GoogleDriveAsset />
                </SvgIcon>
              </ListItemIcon>
              <ListItemText
                // @ts-ignore
                primary={<Typography noWrap>{extractDataSourceData(item)?.folderName || 'Google Drive'}</Typography>}
                secondary={item?.lastSyncedAt
                  ? `Last synced at ${(new Date(item?.lastSyncedAt)).toDateString()}`
                  : item?.lastSyncErrorCode
                    ? (
                      <Box flexDirection="row" display="flex">
                        <Error fontSize="small" style={{ marginRight: theme.spacing(1) }} /><Typography variant="body2">Sync did not succeed</Typography>
                      </Box>
                    )
                    : 'Syncing...'
                }
              />
            </ListItem>
          ))}
        </List>
      </div>
      <DataSourcesAddDrawer open={isDrawerOpened} onClose={(key) => {
        setIsDrawerOpened(false)
        if (key === 'drive') {
          setIsGoogleDriveOpened(true)
        }
      }} />
      {isActionsDrawerOpenWith && <DataSourcesActionsDrawer openWith={isActionsDrawerOpenWith} onClose={() => setIsActionsDrawerOpenWith(undefined)} />}
      {isGoogleDriveOpened && <GoogleDriveDataSource onClose={() => setIsGoogleDriveOpened(false)} />}
    </>
  );
}