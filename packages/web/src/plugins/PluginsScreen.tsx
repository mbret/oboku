import { memo } from "react"
import { TopBarNavigation } from "../navigation/TopBarNavigation"
import {
  capitalize,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack
} from "@mui/material"
import { plugins } from "./configure"
import { ExtensionRounded } from "@mui/icons-material"
import { Link } from "react-router-dom"
import { ROUTES } from "../constants"

export const PluginsScreen = memo(() => {
  return (
    <>
      <Stack flex={1} overflow="auto">
        <TopBarNavigation title={"Plugins"} showBack={false} />
        <List>
          {plugins.map((plugin) => (
            <ListItemButton
              key={plugin.name}
              component={Link}
              to={ROUTES.PLUGINS_TYPE.replace(":type", plugin.type)}
            >
              <ListItemIcon>
                {plugin.Icon ? <plugin.Icon /> : <ExtensionRounded />}
              </ListItemIcon>
              <ListItemText
                primary={capitalize(plugin.name)}
                secondary={plugin.description}
              />
            </ListItemButton>
          ))}
        </List>
      </Stack>
    </>
  )
})
