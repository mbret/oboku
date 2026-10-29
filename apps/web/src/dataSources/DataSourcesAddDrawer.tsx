import {
  Drawer,
  List,
  ListItemIcon,
  ListItemText,
  ListItemButton,
} from "@mui/material"
import { plugins } from "../integrations/plugins/configure"
import {
  useGetIsPluginEnabled,
  useGetIsPluginVisible,
} from "../integrations/plugins/useIsPluginEnabled"

export const DataSourcesAddDrawer = ({
  open,
  onClose,
}: {
  open: boolean
  onClose: (key?: string) => void
}) => {
  const isPluginVisible = useGetIsPluginVisible()
  const isPluginEnabled = useGetIsPluginEnabled()
  const dataSourcesPlugins = plugins.filter(
    (plugin) => plugin.canSynchronize && isPluginVisible(plugin),
  )

  return (
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
                <dataSource.Icon />
              </ListItemIcon>
              <ListItemText primary={`${dataSource.name}`} />
            </ListItemButton>
          ))}
        </List>
      </div>
    </Drawer>
  )
}
