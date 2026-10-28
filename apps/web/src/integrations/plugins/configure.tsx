import type { DataSourceDocType } from "@oboku/shared"
import type { ObokuPlugin } from "./types"
import { plugin as dropbox } from "../dropbox/dropboxPlugin"
import { plugin as google } from "../google/googleDrivePlugin"
import { plugin as file } from "./local"
import { plugin as oneDrive } from "../one-drive/oneDrivePlugin"
import { plugin as server } from "../server/serverPlugin"
import { plugin as synologyDrive } from "../synology-drive/synologyDrivePlugin"
import uri from "./uri"
import webdav from "../webdav/webdavPlugin"

type PluginsByType = {
  [K in DataSourceDocType["type"]]: ObokuPlugin<K>
}

export const pluginsByType: PluginsByType = {
  DRIVE: google,
  URI: uri,
  dropbox,
  file,
  "one-drive": oneDrive,
  server,
  "synology-drive": synologyDrive,
  webdav,
}

export type Plugin = (typeof pluginsByType)[keyof typeof pluginsByType]

export const plugins = Object.values(pluginsByType)

export function getPluginByType<T extends DataSourceDocType["type"]>(type: T) {
  return pluginsByType[type]
}
