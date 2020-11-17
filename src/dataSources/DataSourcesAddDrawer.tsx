import { Drawer, ListItem, List, ListItemIcon, ListItemText } from "@material-ui/core";
import React, { FC } from "react";
import { StorageRounded } from "@material-ui/icons";

export const DataSourcesAddDrawer: FC<{
  open: boolean,
  onClose: (key?: 'drive') => void,
}> = ({ open, onClose }) => {
  return (
    <>
      <Drawer
        anchor="bottom"
        open={open}
        onClose={() => onClose()}
      >
        <div
          role="presentation"
        >
          <List>
            <ListItem button onClick={() => onClose('drive')}>
              <ListItemIcon><StorageRounded /></ListItemIcon>
              <ListItemText primary="Add a Google Drive folder" />
            </ListItem>
          </List>
        </div>
      </Drawer>
    </>
  );
}