import {
  Drawer,
  List,
  ListItemIcon,
  ListItemText,
  ListItemButton,
} from "@mui/material"
import type { FC } from "react"
import { plugins } from "../plugins/configure"
import { isPluginEnabled } from "../plugins/useIsPluginEnabled"

export const DataSourcesAddDrawer: FC<{
  open: boolean
  onClose: (key?: string) => void
}> = ({ open, onClose }) => {
  const dataSourcesPlugins = plugins.filter((plugin) => plugin.canSynchronize)

  return (
    <>
      <Drawer anchor="bottom" open={open} onClose={() => onClose()}>
        <div role="presentation">
          <List>
            {dataSourcesPlugins.map((dataSource) => (
              <ListItemButton
                onClick={() => onClose(dataSource.type)}
                key={dataSource.type}
                disabled={!isPluginEnabled(dataSource)}
              >
                <ListItemIcon>
                  {dataSource.Icon && <dataSource.Icon />}
                </ListItemIcon>
                <ListItemText primary={`${dataSource.name}`} />
              </ListItemButton>
            ))}
          </List>
        </div>
      </Drawer>
    </>
  )
}
