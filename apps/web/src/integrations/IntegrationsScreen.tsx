import { memo } from "react"
import { ListItemButton, ListItemIcon, ListItemText } from "@mui/material"
import { ExtensionRounded } from "@mui/icons-material"
import { generatePath, Link } from "react-router"
import { TopBarNavigation } from "../navigation/TopBarNavigation"
import { ROUTES } from "../navigation/routes"
import {
  useGetIsPluginEnabled,
  useGetIsPluginVisible,
} from "../plugins/useIsPluginEnabled"
import { PageContainer } from "../common/PageContainer"
import { PageSection } from "../common/PageSection"
import { Page } from "../common/Page"
import { type Integration, integrations } from "./configure"

export const IntegrationsScreen = memo(function IntegrationsScreen() {
  const isPluginVisible = useGetIsPluginVisible()
  const isPluginEnabled = useGetIsPluginEnabled()

  const isIntegrationVisible = (integration: Integration) =>
    !integration.plugin || isPluginVisible(integration.plugin)

  const isIntegrationEnabled = (integration: Integration) =>
    !integration.plugin || isPluginEnabled(integration.plugin)

  return (
    <Page bottomGutter={false}>
      <TopBarNavigation title="Integrations" showBack={false} />
      <PageContainer disableGutters>
        <PageSection>
          {integrations.filter(isIntegrationVisible).map((integration) => (
            <ListItemButton
              key={integration.id}
              component={Link}
              disabled={!isIntegrationEnabled(integration)}
              to={generatePath(ROUTES.INTEGRATION_DETAILS, {
                id: integration.id,
              })}
            >
              <ListItemIcon>
                {integration.Icon ? <integration.Icon /> : <ExtensionRounded />}
              </ListItemIcon>
              <ListItemText
                primary={integration.name}
                secondary={integration.description}
              />
            </ListItemButton>
          ))}
        </PageSection>
      </PageContainer>
    </Page>
  )
})
