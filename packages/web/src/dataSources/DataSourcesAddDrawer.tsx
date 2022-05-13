import {
  Drawer,
  ListItem,
  List,
  ListItemIcon,
  ListItemText
} from "@mui/material"
import { FC } from "react"
import { plugins } from "./configure"

export const DataSourcesAddDrawer: FC<{
  open: boolean
  onClose: (key?: string) => void
}> = ({ open, onClose }) => {
  const dataSourcesPlugins = plugins.filter((plugin) => plugin.synchronizable)

  return (
    <>
      <Drawer anchor="bottom" open={open} onClose={() => onClose()}>
        <div role="presentation">
          <List>
            {dataSourcesPlugins.map((dataSource) => (
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
