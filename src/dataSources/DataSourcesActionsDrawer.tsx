import { Drawer, ListItem, List, ListItemIcon, ListItemText, Divider } from "@material-ui/core";
import React, { FC } from "react";
import { SyncRounded, DeleteForeverRounded } from "@material-ui/icons";
import { useSynchronizeDataSource, useRemoveDataSource } from './helpers'

export const DataSourcesActionsDrawer: FC<{
  openWith: string,
  onClose: () => void,
}> = ({ openWith, onClose }) => {
  const syncDataSource = useSynchronizeDataSource()
  // const renewAuthorization = useRenewDataSourceCredentials()
  const [remove] = useRemoveDataSource()

  return (
    <>
      <Drawer
        anchor="bottom"
        open={true}
        onClose={onClose}
      >
        <List>
          <ListItem button onClick={() => {
            syncDataSource(openWith)
            onClose()
          }}>
            <ListItemIcon><SyncRounded /></ListItemIcon>
            <ListItemText primary="Synchronize" />
          </ListItem>
          {/* <ListItem button onClick={() => {
            renewAuthorization(openWith)
            onClose()
          }}>
            <ListItemIcon><VpnKeyRounded /></ListItemIcon>
            <ListItemText primary="Renew authorization" />
          </ListItem> */}
        </List>
        <Divider />
        <List>
          <ListItem button
            onClick={() => {
              onClose()
              remove({ id: openWith })
            }}
          >
            <ListItemIcon>
              <DeleteForeverRounded />
            </ListItemIcon>
            <ListItemText primary="Remove the data source" />
          </ListItem>
        </List>
      </Drawer>
    </>
  );
}