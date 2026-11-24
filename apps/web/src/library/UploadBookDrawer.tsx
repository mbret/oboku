import {
  Drawer,
  List,
  ListItemText,
  ListItemIcon,
  ListItemButton,
} from "@mui/material"
import { plugins } from "../librarySyncs"
import { memo } from "react"
import {
  useGetIsPluginEnabled,
  useGetIsPluginVisible,
} from "../integrations/plugins/useIsPluginEnabled"

export const UploadBookDrawer = memo(function UploadBookDrawer({
  open,
  onClose,
}: {
  open: boolean
  onClose: (type?: string | undefined) => void
}) {
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
            .map((plugin) => (
              <ListItemButton
                onClick={() => onClose(plugin.type)}
                key={plugin.type}
                disabled={!isPluginEnabled(plugin)}
              >
                <ListItemIcon>
                  <plugin.Icon />
                </ListItemIcon>
                <ListItemText primary={`From ${plugin.name}`} />
              </ListItemButton>
            ))}
        </List>
      </div>
    </Drawer>
  )
})
