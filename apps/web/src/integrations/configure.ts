import { MenuBookRounded } from "@mui/icons-material"
import type { SvgIconProps } from "@mui/material"
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

export type Integration = {
  id: string
  name: string
  description: string
  Icon?: ComponentType<SvgIconProps>
  InfoScreen: ComponentType
  /**
   * The instance configuration enables the integration through this plugin.
   * An integration without one is always available.
   */
  plugin?: Plugin
}

export const integrations: ReadonlyArray<Integration> = [
  {
    id: "dropbox",
    name: "Dropbox",
    description: "Manage contents from Dropbox",
    Icon: dropboxPlugin.Icon,
    InfoScreen: DropboxInfoScreen,
    plugin: dropboxPlugin,
  },
  {
    id: "google",
    name: "Google",
    description: "Manage contents from Google Drive",
    Icon: googleDrivePlugin.Icon,
    InfoScreen: GoogleInfoScreen,
    plugin: googleDrivePlugin,
  },
  {
    id: "koreader",
    name: "KOReader",
    description: "Sync reading positions with KOReader, Readest, CrossPoint…",
    Icon: MenuBookRounded,
    InfoScreen: KoreaderInfoScreen,
  },
  {
    id: "one-drive",
    name: "OneDrive",
    description: "Manage contents from Microsoft OneDrive",
    Icon: oneDrivePlugin.Icon,
    InfoScreen: OneDriveInfoScreen,
    plugin: oneDrivePlugin,
  },
  {
    id: "server",
    name: "Server",
    description: "Manage contents from your oboku server",
    Icon: serverPlugin.Icon,
    InfoScreen: ServerInfoScreen,
    plugin: serverPlugin,
  },
  {
    id: "synology-drive",
    name: "Synology Drive",
    description:
      "Browse a Synology Drive library and add books by stable file id",
    Icon: synologyDrivePlugin.Icon,
    InfoScreen: SynologyDriveInfoScreen,
    plugin: synologyDrivePlugin,
  },
  {
    id: "webdav",
    name: "WebDAV",
    description: "Manage contents from WebDAV",
    Icon: webdavPlugin.Icon,
    InfoScreen: WebdavInfoScreen,
    plugin: webdavPlugin,
  },
]
