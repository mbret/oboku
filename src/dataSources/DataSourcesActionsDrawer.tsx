import { Drawer, ListItem, List, ListItemIcon, ListItemText } from "@material-ui/core";
import React, { FC } from "react";
import { SyncRounded } from "@material-ui/icons";

export const DataSourcesActionsDrawer: FC<{
  openWith: string,
  onClose: () => void,
}> = ({ openWith, onClose }) => {
  console.error('todo')
  // const [syncDataSource] = useMutation(MutationSyncDataSourceDocument)

  return (
    <>
      <Drawer
        anchor="bottom"
        open={true}
        onClose={onClose}
      >
        <div
          role="presentation"
        >
          <List>
            <ListItem button onClick={() => {
              // syncDataSource({ variables: { id: openWith } })
              onClose()
            }}>
              <ListItemIcon><SyncRounded /></ListItemIcon>
              <ListItemText primary="Synchronize" />
            </ListItem>
          </List>
        </div>
      </Drawer>
    </>
  );
}