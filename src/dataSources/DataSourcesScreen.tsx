import React, { useState } from 'react';
import { TopBarNavigation } from '../TopBarNavigation';
import { Link, Button, Toolbar, List, ListItem, ListItemText, SvgIcon, ListItemIcon, Typography } from '@material-ui/core';
import { useHistory } from 'react-router-dom';
import { Alert } from '@material-ui/lab';
import { ROUTES } from '../constants';
import { DataSourcesAddDrawer } from './DataSourcesAddDrawer';
import { GoogleDriveDataSource } from './GoogleDriveDataSource';
import { ReactComponent as GoogleDriveAsset } from '../assets/google-drive.svg';
import { DataSourcesActionsDrawer } from './DataSourcesActionsDrawer';
import { DataSource, dataSourcesAsArrayState } from './states';
import { useRecoilValue } from 'recoil';

const extractGoogleDriveData = (item: DataSource) => {
  if (item?.data) {
    return JSON.parse(item.data) as { name?: string, id?: string }
  }
  return undefined
}

export const DataSourcesScreen = () => {
  const history = useHistory()
  const [isDrawerOpened, setIsDrawerOpened] = useState(false)
  const [isGoogleDriveOpened, setIsGoogleDriveOpened] = useState(false)
  const [isActionsDrawerOpenWith, setIsActionsDrawerOpenWith] = useState<string | undefined>(undefined)
  const dataSources = useRecoilValue(dataSourcesAsArrayState)

  return (
    <>
      <div style={{
        display: 'flex',
        flex: 1,
        overflow: 'scroll',
        flexFlow: 'column',
      }}>
        <TopBarNavigation title={'Data sources'} showBack={false} />
        <Alert severity="info">Automatically add books from an external source (eg: Google Drive shared folder). <Link onClick={() => history.push(ROUTES.FAQ)}>Learn more</Link></Alert>
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
                primary={<Typography noWrap>{extractGoogleDriveData(item)?.name}</Typography>}
                secondary={item?.lastSyncedAt ? `Last synced at ${(new Date(item?.lastSyncedAt)).toDateString()}` : 'Syncing...'}
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