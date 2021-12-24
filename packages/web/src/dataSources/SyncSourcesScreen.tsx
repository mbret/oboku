import React, { useState } from 'react';
import { TopBarNavigation } from '../navigation/TopBarNavigation';
import { Link, Button, Toolbar, List, ListItem, ListItemText, SvgIcon, ListItemIcon, Typography, useTheme } from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import { DataSourcesAddDrawer } from './DataSourcesAddDrawer';
import { DataSourcesActionsDrawer } from './DataSourcesActionsDrawer';
import { dataSourcesAsArrayState } from './states';
import { useRecoilValue } from 'recoil';
import { Error } from '@material-ui/icons';
import { DataSourceDocType } from '@oboku/shared';
import { plugins as dataSourcePlugins } from './configure';
import { AddDataSource } from './AddDataSource';
import { Errors } from "@oboku/shared"
import { ObokuDataSourcePlugin } from './types';

export const SyncSourcesScreen = () => {
  const [isDrawerOpened, setIsDrawerOpened] = useState(false)
  const [isAddDataSourceOpenedWith, setIsAddDataSourceOpenedWith] = useState<ObokuDataSourcePlugin | undefined>(undefined)
  const [isActionsDrawerOpenWith, setIsActionsDrawerOpenWith] = useState<string | undefined>(undefined)
  const syncSources = useRecoilValue(dataSourcesAsArrayState)
  const theme = useTheme()

  return (
    <>
      <div style={{
        display: 'flex',
        flex: 1,
        overflow: 'scroll',
        flexFlow: 'column',
      }}>
        <TopBarNavigation title={'Data Sources'} showBack={false} />
        <Alert severity="info">
          Automatically synchronize books from an external source (eg: Google Drive shared folder). <Link href="https://docs.oboku.me" target="__blank">Learn more</Link>
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
          {syncSources?.map(syncSource => {
            const dataSource = dataSourcePlugins.find(dataSource => dataSource.type === syncSource.type)

            return (
              <ListItem key={syncSource._id} button onClick={() => setIsActionsDrawerOpenWith(syncSource._id)}>
                {dataSource && (
                  <ListItemIcon>
                    <SvgIcon >
                      {dataSource.Icon && <dataSource.Icon />}
                    </SvgIcon>
                  </ListItemIcon>
                )}
                <ListItemText
                  primary={<SyncSourceLabel syncSource={syncSource} />}
                  secondary={
                    syncSource?.syncStatus === 'fetching'
                      ? 'Syncing...'
                      : syncSource?.lastSyncErrorCode
                        ? (
                          <div style={{ flexDirection: 'row', display: 'flex', }}>
                            <Error fontSize="small" style={{ marginRight: theme.spacing(1) }} />
                            <Typography variant="body2">
                              {`Sync did not succeed`}
                              {syncSource?.lastSyncErrorCode === Errors.ERROR_DATASOURCE_UNAUTHORIZED && (
                                `. We could not connect to ${dataSource?.name}. If the problem persist try to reload the app`
                              )}
                              {syncSource?.lastSyncErrorCode === Errors.ERROR_DATASOURCE_RATE_LIMIT_EXCEEDED && (
                                `. Your datasource seems to have exceeded its allowed access limit`
                              )}
                              {syncSource?.lastSyncErrorCode === Errors.ERROR_DATASOURCE_NETWORK_UNREACHABLE && (
                                `. Our server seems unreachable, make sure you are online to start the synchronization`
                              )}
                            </Typography>
                          </div>
                        )
                        : syncSource?.lastSyncedAt
                          ? `Last synced at ${(new Date(syncSource?.lastSyncedAt)).toDateString()}`
                          : 'Not synced yet'

                  }
                />
              </ListItem>
            )
          })}
        </List>
      </div>
      <DataSourcesAddDrawer open={isDrawerOpened} onClose={(type) => {
        setIsDrawerOpened(false)
        const dataSource = dataSourcePlugins.find((dataSource) => type === dataSource.type)
        if (dataSource) {
          setIsAddDataSourceOpenedWith(dataSource)
        }
      }} />
      {isActionsDrawerOpenWith && <DataSourcesActionsDrawer openWith={isActionsDrawerOpenWith} onClose={() => setIsActionsDrawerOpenWith(undefined)} />}
      {isAddDataSourceOpenedWith && <AddDataSource onClose={() => setIsAddDataSourceOpenedWith(undefined)} openWith={isAddDataSourceOpenedWith} />}
    </>
  );
}

const SyncSourceLabel = ({ syncSource }: { syncSource: DataSourceDocType }) => {
  const dataSource = dataSourcePlugins.find(dataSource => dataSource.type === syncSource.type)

  const { name = dataSource?.name } = (dataSource?.useSyncSourceInfo && dataSource.useSyncSourceInfo(syncSource)) || {}

  return (
    <Typography noWrap>{name}</Typography>
  )
}