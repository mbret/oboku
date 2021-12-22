import { Drawer, ListItem, List, ListItemIcon, ListItemText } from "@material-ui/core";
import { DataSourceType } from "@oboku/shared";
import { FC } from "react";
import { useDataSourcePlugins } from "./helpers";

export const DataSourcesAddDrawer: FC<{
  open: boolean,
  onClose: (key?: DataSourceType) => void,
}> = ({ open, onClose }) => {
  const dataSourcesPlugins = useDataSourcePlugins().filter(plugin => plugin.synchronizable)

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
                  {dataSource.Icon && <dataSource.Icon />}
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