import type { ComponentType } from "react"
import {
  ListItemButton,
  ListItemIcon,
  ListItemText,
  type SvgIconProps,
} from "@mui/material"
import { ExtensionRounded, MenuBookRounded } from "@mui/icons-material"
import { Link } from "react-router"
import { TopBarNavigation } from "../navigation/TopBarNavigation"
import { ROUTES } from "../navigation/routes"
import type { Plugin } from "./plugins/configure"
import {
  useGetIsPluginEnabled,
  useGetIsPluginVisible,
} from "./plugins/useIsPluginEnabled"
import { PageContainer } from "../common/PageContainer"
import { PageSection } from "../common/PageSection"
import { Page } from "../common/Page"
import { plugin as dropboxPlugin } from "./dropbox/dropboxPlugin"
import { plugin as googleDrivePlugin } from "./google/googleDrivePlugin"
import { plugin as oneDrivePlugin } from "./one-drive/oneDrivePlugin"
import { plugin as serverPlugin } from "./server/serverPlugin"
import { plugin as synologyDrivePlugin } from "./synology-drive/synologyDrivePlugin"
import webdavPlugin from "./webdav/webdavPlugin"

function IntegrationListItem({
  to,
  name,
  description,
  Icon = ExtensionRounded,
  plugin,
}: {
  to: string
  name: string
  description: string
  Icon?: ComponentType<SvgIconProps>
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
          <IntegrationListItem
            to={ROUTES.INTEGRATION_DROPBOX}
            name="Dropbox"
            description="Manage contents from Dropbox"
            Icon={dropboxPlugin.Icon}
            plugin={dropboxPlugin}
          />
          <IntegrationListItem
            to={ROUTES.INTEGRATION_GOOGLE}
            name="Google"
            description="Manage contents from Google Drive"
            Icon={googleDrivePlugin.Icon}
            plugin={googleDrivePlugin}
          />
          <IntegrationListItem
            to={ROUTES.INTEGRATION_KOREADER}
            name="KOReader"
            description="Sync reading positions with KOReader, Readest, CrossPoint…"
            Icon={MenuBookRounded}
          />
          <IntegrationListItem
            to={ROUTES.INTEGRATION_ONE_DRIVE}
            name="OneDrive"
            description="Manage contents from Microsoft OneDrive"
            Icon={oneDrivePlugin.Icon}
            plugin={oneDrivePlugin}
          />
          <IntegrationListItem
            to={ROUTES.INTEGRATION_SERVER}
            name="Server"
            description="Manage contents from your oboku server"
            Icon={serverPlugin.Icon}
            plugin={serverPlugin}
          />
          <IntegrationListItem
            to={ROUTES.INTEGRATION_SYNOLOGY_DRIVE}
            name="Synology Drive"
            description="Browse a Synology Drive library and add books by stable file id"
            Icon={synologyDrivePlugin.Icon}
            plugin={synologyDrivePlugin}
          />
          <IntegrationListItem
            to={ROUTES.INTEGRATION_WEBDAV}
            name="WebDAV"
            description="Manage contents from WebDAV"
            Icon={webdavPlugin.Icon}
            plugin={webdavPlugin}
          />
        </PageSection>
      </PageContainer>
    </Page>
  )
}
