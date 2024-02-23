import { FC } from "react"
import {
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from "@mui/material"
import { SdStorageRounded } from "@mui/icons-material"
import { plugins as dataSourcePlugins } from "../dataSources"
import { useLocalSettings } from "../settings/states"

export const UploadBookDrawer: FC<{
  open: boolean
  onClose: (type?: "device" | string | undefined) => void
}> = ({ open, onClose }) => {
  const { showSensitiveDataSources } = useLocalSettings()

  return (
    <>
      <Drawer
        anchor="bottom"
        open={open}
        onClose={() => onClose()}
        transitionDuration={0}
      >
        <div role="presentation">
          <List>
            <ListItem button onClick={() => onClose("device")}>
              <ListItemIcon>
                <SdStorageRounded />
              </ListItemIcon>
              <ListItemText primary="From device" />
            </ListItem>
            {dataSourcePlugins
              .filter(
                ({ UploadComponent, sensitive }) =>
                  !!UploadComponent &&
                  (showSensitiveDataSources ? true : sensitive !== true)
              )
              .map((dataSource) => (
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
      </Drawer>
    </>
  )
}
