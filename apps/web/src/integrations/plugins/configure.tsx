import type { DataSourceDocType } from "@oboku/shared"
import {
  type RegisteredPlugin,
  registerPlugin,
} from "./requests/registerPlugin"
import { plugin as dropbox } from "../dropbox/dropboxPlugin"
import { plugin as google } from "../google/googleDrivePlugin"
import { plugin as file } from "./local"
import { plugin as oneDrive } from "../one-drive/oneDrivePlugin"
import { plugin as server } from "../server/serverPlugin"
import { plugin as synologyDrive } from "../synology-drive/synologyDrivePlugin"
import uri from "./uri"
import webdav from "../webdav/webdavPlugin"

type PluginsByType = {
  [K in DataSourceDocType["type"]]: RegisteredPlugin<K>
}

export const pluginsByType: PluginsByType = {
  DRIVE: registerPlugin(google),
  URI: registerPlugin(uri),
  dropbox: registerPlugin(dropbox),
  file: registerPlugin(file),
  "one-drive": registerPlugin(oneDrive),
  server: registerPlugin(server),
  "synology-drive": registerPlugin(synologyDrive),
  webdav: registerPlugin(webdav),
}

export type Plugin = (typeof pluginsByType)[keyof typeof pluginsByType]

export const plugins = Object.values(pluginsByType)

export function getPluginByType<T extends DataSourceDocType["type"]>(type: T) {
  return pluginsByType[type]
}

export function isPluginType(
  type: string | undefined,
): type is DataSourceDocType["type"] {
  return type !== undefined && Object.hasOwn(pluginsByType, type)
}
