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
import { useGetIsPluginEnabled } from "../plugins/useIsPluginEnabled"

export const UploadBookDrawer = memo(
  ({
    open,
    onClose,
  }: {
    open: boolean
    onClose: (type?: string | undefined) => void
  }) => {
    const isPluginEnabled = useGetIsPluginEnabled()

    return (
      <Drawer anchor="bottom" open={open} onClose={() => onClose()}>
        <div role="presentation">
          <List>
            {plugins
              .filter((plugin) => !!plugin.UploadBookComponent)
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
