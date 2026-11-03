import type { ComponentType } from "react"
import {
  ListItemButton,
  ListItemIcon,
  ListItemText,
  type SvgIconProps,
} from "@mui/material"
import { MenuBookRounded } from "@mui/icons-material"
import { Link } from "react-router"
import { TopBarNavigation } from "../navigation/TopBarNavigation"
import { ROUTES } from "../navigation/routes"
import { plugins, type Plugin } from "./plugins/configure"
import {
  useGetIsPluginEnabled,
  useGetIsPluginVisible,
} from "./plugins/useIsPluginEnabled"
import type { PluginIntegration } from "./plugins/types"
import { PageContainer } from "../common/PageContainer"
import { PageSection } from "../common/PageSection"
import { Page } from "../common/Page"

type IntegrationEntry = PluginIntegration & {
  Icon: ComponentType<SvgIconProps>
  plugin?: Plugin
}

const koreaderIntegration: IntegrationEntry = {
  name: "KOReader",
  description: "Sync reading positions with KOReader, Readest, CrossPoint…",
  route: ROUTES.INTEGRATION_KOREADER,
  Icon: MenuBookRounded,
}

const pluginIntegrations = plugins.flatMap(
  function toIntegrationEntry(plugin): IntegrationEntry[] {
    return plugin.integration
      ? [{ ...plugin.integration, Icon: plugin.Icon, plugin }]
      : []
  },
)

const integrationEntries = [
  koreaderIntegration,
  ...pluginIntegrations,
].toSorted(function byName(a, b) {
  return a.name.localeCompare(b.name)
})

function IntegrationListItem({
  integration: { name, description, route, Icon, plugin },
}: {
  integration: IntegrationEntry
}) {
  const isPluginVisible = useGetIsPluginVisible()
  const isPluginEnabled = useGetIsPluginEnabled()
  const isVisible = !plugin || isPluginVisible(plugin)
  const isEnabled = !plugin || isPluginEnabled(plugin)

  if (!isVisible) return null

  return (
    <ListItemButton component={Link} to={route} disabled={!isEnabled}>
      <ListItemIcon>
        <Icon />
      </ListItemIcon>
      <ListItemText primary={name} secondary={description} />
    </ListItemButton>
  )
}

export function IntegrationsScreen() {
  return (
    <Page bottomGutter={false}>
      <TopBarNavigation title="Integrations" showBack={false} />
      <PageContainer disableGutters>
        <PageSection>
          {integrationEntries.map((integration) => (
            <IntegrationListItem
              key={integration.route}
              integration={integration}
            />
          ))}
        </PageSection>
      </PageContainer>
    </Page>
  )
}
