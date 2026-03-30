import {
  Drawer,
  List,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  capitalize,
} from "@mui/material"
import { plugins } from "../dataSources"
import { memo } from "react"
import {
  useGetIsPluginEnabled,
  useGetIsPluginVisible,
} from "../plugins/useIsPluginEnabled"

export const UploadBookDrawer = memo(
  ({
    open,
    onClose,
  }: {
    open: boolean
    onClose: (type?: string | undefined) => void
  }) => {
    const isPluginVisible = useGetIsPluginVisible()
    const isPluginEnabled = useGetIsPluginEnabled()

    return (
      <Drawer anchor="bottom" open={open} onClose={() => onClose()}>
        <div role="presentation">
          <List>
            {plugins
              .filter(
                (plugin) =>
                  !!plugin.UploadBookComponent && isPluginVisible(plugin),
              )
              .map((dataSource) => (
                <ListItemButton
                  onClick={() => onClose(dataSource.type)}
                  key={dataSource.type}
                  disabled={!isPluginEnabled(dataSource)}
                >
                  <ListItemIcon>
                    {dataSource.Icon && <dataSource.Icon />}
                  </ListItemIcon>
                  <ListItemText
                    primary={`From ${capitalize(dataSource.name)}`}
                  />
                </ListItemButton>
              ))}
          </List>
        </div>
      </Drawer>
    )
  },
)
