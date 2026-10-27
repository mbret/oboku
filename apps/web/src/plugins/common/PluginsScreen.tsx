import { memo } from "react"
import { TopBarNavigation } from "../../navigation/TopBarNavigation"
import {
  capitalize,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material"
import { plugins } from "../configure"
import { ExtensionRounded } from "@mui/icons-material"
import { generatePath, Link } from "react-router"
import { ROUTES } from "../../navigation/routes"
import {
  useGetIsPluginEnabled,
  useGetIsPluginVisible,
} from "../useIsPluginEnabled"
import { PageContainer } from "../../common/PageContainer"
import { PageSection } from "../../common/PageSection"
import { Page } from "../../common/Page"

export const PluginsScreen = memo(function PluginsScreen() {
  const isPluginVisible = useGetIsPluginVisible()
  const isPluginEnabled = useGetIsPluginEnabled()

  return (
    <Page bottomGutter={false}>
      <TopBarNavigation title={"Plugins"} showBack={false} />
      <PageContainer disableGutters>
        <PageSection>
          {plugins.filter(isPluginVisible).map((plugin) => (
            <ListItemButton
              key={plugin.type}
              component={Link}
              disabled={!isPluginEnabled(plugin)}
              to={generatePath(ROUTES.PLUGINS_TYPE, { type: plugin.type })}
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
        </PageSection>
      </PageContainer>
    </Page>
  )
})
