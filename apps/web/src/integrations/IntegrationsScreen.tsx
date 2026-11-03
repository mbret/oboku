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

function getIntegrationEntries() {
  const pluginIntegrations = plugins.flatMap(
    function toIntegrationEntry(plugin): IntegrationEntry[] {
      return plugin.integration
        ? [{ ...plugin.integration, Icon: plugin.Icon, plugin }]
        : []
    },
  )

  return [koreaderIntegration, ...pluginIntegrations].toSorted(
    function byName(a, b) {
      return a.name.localeCompare(b.name)
    },
  )
}

function IntegrationListItem({
  to,
  name,
  description,
  Icon,
  plugin,
}: {
  to: string
  name: string
  description: string
  Icon: ComponentType<SvgIconProps>
  plugin?: Plugin
}) {
  const isPluginVisible = useGetIsPluginVisible()
  const isPluginEnabled = useGetIsPluginEnabled()
  const isVisible = !plugin || isPluginVisible(plugin)
  const isEnabled = !plugin || isPluginEnabled(plugin)

  if (!isVisible) return null

  return (
    <ListItemButton component={Link} to={to} disabled={!isEnabled}>
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
          {getIntegrationEntries().map((integration) => (
            <IntegrationListItem
              key={integration.route}
              to={integration.route}
              name={integration.name}
              description={integration.description}
              Icon={integration.Icon}
              plugin={integration.plugin}
            />
          ))}
        </PageSection>
      </PageContainer>
    </Page>
  )
}
