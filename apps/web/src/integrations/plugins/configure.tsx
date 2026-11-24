import type { SourceType } from "@oboku/shared"
import type { SourcePlugin } from "./types"
import { plugin as dropbox } from "../dropbox/dropboxPlugin"
import { plugin as google } from "../google/googleDrivePlugin"
import { plugin as file } from "./local"
import { plugin as oneDrive } from "../one-drive/oneDrivePlugin"
import { plugin as opds } from "../opds/opdsPlugin"
import { plugin as server } from "../server/serverPlugin"
import { plugin as synologyDrive } from "../synology-drive/synologyDrivePlugin"
import uri from "./uri"
import webdav from "../webdav/webdavPlugin"

type PluginsByType = {
  [K in SourceType]: SourcePlugin<K>
}

export const pluginsByType: PluginsByType = {
  DRIVE: google,
  URI: uri,
  dropbox,
  file,
  "one-drive": oneDrive,
  opds,
  server,
  "synology-drive": synologyDrive,
  webdav,
}

export type Plugin = (typeof pluginsByType)[keyof typeof pluginsByType]

export const plugins = Object.values(pluginsByType)

export function getPluginByType<T extends SourceType>(type: T) {
  return pluginsByType[type]
}

export function isPluginType(type: string | undefined): type is SourceType {
  return type !== undefined && Object.hasOwn(pluginsByType, type)
}
