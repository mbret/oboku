import { Drawer, ListItem, List, ListItemIcon, ListItemText, SvgIcon } from "@material-ui/core";
import { DataSourceType } from "@oboku/shared";
import React, { FC } from "react";
import { useDataSourcePlugins } from "./helpers";

export const DataSourcesAddDrawer: FC<{
  open: boolean,
  onClose: (key?: DataSourceType) => void,
}> = ({ open, onClose }) => {
  const dataSourcesPlugins = useDataSourcePlugins()

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
            {dataSourcesPlugins.map(dataSource => (
              <ListItem button onClick={() => onClose(dataSource.type)} key={dataSource.type}>
                <ListItemIcon>
                  <SvgIcon>
                    <dataSource.Icon />
                  </SvgIcon>
                </ListItemIcon>
                <ListItemText primary={`From ${dataSource.name}`} />
              </ListItem>
            ))}
          </List>
        </div>
      </Drawer>
    </>
  );
}