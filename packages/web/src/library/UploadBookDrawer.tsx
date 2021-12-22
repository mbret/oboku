import { FC } from 'react';
import { Drawer, List, ListItem, ListItemText, ListItemIcon } from '@material-ui/core';
import { SdStorageRounded } from '@material-ui/icons';
import { useDataSourcePlugins } from '../dataSources/helpers';

export const UploadBookDrawer: FC<{
  open: boolean,
  onClose: (type?: 'device' | ReturnType<typeof useDataSourcePlugins>[number]['type'] | undefined) => void
}> = ({ open, onClose }) => {
  const dataSourcePlugins = useDataSourcePlugins()

  return (
    <>
      <Drawer
        anchor="bottom"
        open={open}
        onClose={() => onClose()}
        transitionDuration={0}
      >
        <div
          role="presentation"
        >
          <List>
            <ListItem
              button
              onClick={() => onClose('device')}
            >
              <ListItemIcon>
                <SdStorageRounded />
              </ListItemIcon>
              <ListItemText primary="From device" />
            </ListItem>
            {dataSourcePlugins.filter(({ UploadComponent }) => !!UploadComponent).map(dataSource => (
              <ListItem
                button
                onClick={() => onClose(dataSource.type)}
                key={dataSource.type}
              >
                <ListItemIcon>
                  {dataSource.Icon && <dataSource.Icon />}
                </ListItemIcon>
                <ListItemText primary={`From ${dataSource.name}`} />
              </ListItem>
            ))}
          </List>
        </div>
      </Drawer >
    </>
  );
}