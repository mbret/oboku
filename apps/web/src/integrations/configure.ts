import { MenuBookRounded } from "@mui/icons-material"
import type { SvgIconProps } from "@mui/material"
import type { SettingsConnectorType } from "@oboku/shared"
import type { ComponentType } from "react"
import type { Plugin } from "../plugins/configure"
import { InfoScreen as DropboxInfoScreen } from "./dropbox/InfoScreen"
import { plugin as dropboxPlugin } from "./dropbox/dropboxPlugin"
import { InfoScreen as GoogleInfoScreen } from "./google/InfoScreen"
import { plugin as googleDrivePlugin } from "./google/googleDrivePlugin"
import { InfoScreen as KoreaderInfoScreen } from "./koreader/InfoScreen"
import { InfoScreen as OneDriveInfoScreen } from "./one-drive/InfoScreen"
import { plugin as oneDrivePlugin } from "./one-drive/oneDrivePlugin"
import { InfoScreen as ServerInfoScreen } from "./server/InfoScreen"
import { plugin as serverPlugin } from "./server/serverPlugin"
import { InfoScreen as SynologyDriveInfoScreen } from "./synology-drive/InfoScreen"
import { plugin as synologyDrivePlugin } from "./synology-drive/synologyDrivePlugin"
import { InfoScreen as WebdavInfoScreen } from "./webdav/InfoScreen"
import webdavPlugin from "./webdav/webdavPlugin"

/** Connector types are integration ids too: the connector screens link back to their integration by connector type. */
type IntegrationId =
  | SettingsConnectorType
  | "dropbox"
  | "google"
  | "koreader"
  | "one-drive"

export type Integration<Id extends IntegrationId = IntegrationId> = {
  id: Id
  name: string
  description: string
  Icon?: ComponentType<SvgIconProps>
  InfoScreen: ComponentType
  /** The integration is available only while this plugin is enabled, and always when it has none. */
  plugin?: Plugin
}

type IntegrationsById = {
  [Id in IntegrationId]: Integration<Id>
}

const integrationsById: IntegrationsById = {
  dropbox: {
    id: "dropbox",
    name: "Dropbox",
    description: "Manage contents from Dropbox",
    Icon: dropboxPlugin.Icon,
    InfoScreen: DropboxInfoScreen,
    plugin: dropboxPlugin,
  },
  google: {
    id: "google",
    name: "Google",
    description: "Manage contents from Google Drive",
    Icon: googleDrivePlugin.Icon,
    InfoScreen: GoogleInfoScreen,
    plugin: googleDrivePlugin,
  },
  koreader: {
    id: "koreader",
    name: "KOReader",
    description: "Sync reading positions with KOReader, Readest, CrossPoint…",
    Icon: MenuBookRounded,
    InfoScreen: KoreaderInfoScreen,
  },
  "one-drive": {
    id: "one-drive",
    name: "OneDrive",
    description: "Manage contents from Microsoft OneDrive",
    Icon: oneDrivePlugin.Icon,
    InfoScreen: OneDriveInfoScreen,
    plugin: oneDrivePlugin,
  },
  server: {
    id: "server",
    name: "Server",
    description: "Manage contents from your oboku server",
    Icon: serverPlugin.Icon,
    InfoScreen: ServerInfoScreen,
    plugin: serverPlugin,
  },
  "synology-drive": {
    id: "synology-drive",
    name: "Synology Drive",
    description:
      "Browse a Synology Drive library and add books by stable file id",
    Icon: synologyDrivePlugin.Icon,
    InfoScreen: SynologyDriveInfoScreen,
    plugin: synologyDrivePlugin,
  },
  webdav: {
    id: "webdav",
    name: "WebDAV",
    description: "Manage contents from WebDAV",
    Icon: webdavPlugin.Icon,
    InfoScreen: WebdavInfoScreen,
    plugin: webdavPlugin,
  },
}

export const integrations = Object.values(integrationsById)

export const isIntegrationId = (id: string | undefined): id is IntegrationId =>
  id !== undefined && Object.hasOwn(integrationsById, id)

export function getIntegrationById(id: IntegrationId) {
  return integrationsById[id]
}
