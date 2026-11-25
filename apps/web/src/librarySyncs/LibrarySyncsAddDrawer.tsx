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

export const LibrarySyncsAddDrawer = ({
  open,
  onClose,
}: {
  open: boolean
  onClose: (key?: string) => void
}) => {
  const isPluginVisible = useGetIsPluginVisible()
  const isPluginEnabled = useGetIsPluginEnabled()
  const syncablePlugins = plugins.filter(
    (plugin) => plugin.canSynchronize && isPluginVisible(plugin),
  )

  return (
    <Drawer anchor="bottom" open={open} onClose={() => onClose()}>
      <div role="presentation">
        <List>
          {syncablePlugins.map((plugin) => (
            <ListItemButton
              onClick={() => onClose(plugin.type)}
              key={plugin.type}
              disabled={!isPluginEnabled(plugin)}
            >
              <ListItemIcon>
                <plugin.Icon />
              </ListItemIcon>
              <ListItemText primary={`${plugin.name}`} />
            </ListItemButton>
          ))}
        </List>
      </div>
    </Drawer>
  )
}
