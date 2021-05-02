import React, { useState } from 'react';
import { TopBarNavigation } from '../navigation/TopBarNavigation';
import { Link, Button, Toolbar, List, ListItem, ListItemText, SvgIcon, ListItemIcon, Typography, useTheme } from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import { DataSourcesAddDrawer } from './DataSourcesAddDrawer';
import { DataSourcesActionsDrawer } from './DataSourcesActionsDrawer';
import { dataSourcesAsArrayState } from './states';
import { useRecoilValue } from 'recoil';
import { Error } from '@material-ui/icons';
import { extractDataSourceData } from '@oboku/shared';
import { useDataSourcePlugins } from './helpers';
import { AddDataSource } from './AddDataSource';
import { Errors } from "@oboku/shared"

export const DataSourcesScreen = () => {
  const [isDrawerOpened, setIsDrawerOpened] = useState(false)
  const [isAddDataSourceOpenedWith, setIsAddDataSourceOpenedWith] = useState<ReturnType<typeof useDataSourcePlugins>[number] | undefined>(undefined)
  const [isActionsDrawerOpenWith, setIsActionsDrawerOpenWith] = useState<string | undefined>(undefined)
  const dataSources = useRecoilValue(dataSourcesAsArrayState)
  const theme = useTheme()
  const dataSourcesPlugins = useDataSourcePlugins()

  return (
    <>
      <div style={{
        display: 'flex',
        flex: 1,
        overflow: 'scroll',
        flexFlow: 'column',
      }}>
        <TopBarNavigation title={'Data sources links'} showBack={false} />
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
            Add a new link
        </Button>
        </Toolbar>
        <List>
          {dataSources?.map(item => {
            const dataSource = dataSourcesPlugins.find(dataSource => dataSource.type === item.type)

            return (
              <ListItem key={item._id} button onClick={() => setIsActionsDrawerOpenWith(item._id)}>
                {dataSource && (
                  <ListItemIcon>
                    <SvgIcon >
                      <dataSource.Icon />
                    </SvgIcon>
                  </ListItemIcon>
                )}
                <ListItemText
                  primary={<Typography noWrap>{extractDataSourceData(item)?.folderName || dataSource?.name}</Typography>}
                  secondary={
                    item?.syncStatus === 'fetching'
                      ? 'Syncing...'
                      : item?.lastSyncErrorCode
                        ? (
                          <div style={{ flexDirection: 'row', display: 'flex', }}>
                            <Error fontSize="small" style={{ marginRight: theme.spacing(1) }} />
                            <Typography variant="body2">
                              {`Sync did not succeed`}
                              {item?.lastSyncErrorCode === Errors.ERROR_DATASOURCE_UNAUTHORIZED && (
                                `. We could not connect to ${dataSource?.name}. If the problem persist try to reload the app`
                              )}
                              {item?.lastSyncErrorCode === Errors.ERROR_DATASOURCE_RATE_LIMIT_EXCEEDED && (
                                `. Your datasource seems to have exceeded its allowed access limit`
                              )}
                              {item?.lastSyncErrorCode === Errors.ERROR_DATASOURCE_NETWORK_UNREACHABLE && (
                                `. Our server seems unreachable, make sure you are online to start the synchronization`
                              )}
                            </Typography>
                          </div>
                        )
                        : item?.lastSyncedAt
                          ? `Last synced at ${(new Date(item?.lastSyncedAt)).toDateString()}`
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
        const dataSource = dataSourcesPlugins.find((dataSource) => type === dataSource.type)
        if (dataSource) {
          setIsAddDataSourceOpenedWith(dataSource)
        }
      }} />
      {isActionsDrawerOpenWith && <DataSourcesActionsDrawer openWith={isActionsDrawerOpenWith} onClose={() => setIsActionsDrawerOpenWith(undefined)} />}
      {isAddDataSourceOpenedWith && <AddDataSource onClose={() => setIsAddDataSourceOpenedWith(undefined)} openWith={isAddDataSourceOpenedWith} />}
    </>
  );
}