import { plugin as dropbox } from "./dropbox"
import { plugin as google } from "./google"
import { plugin as file } from "./local"
import { plugin as synologyDrive } from "./synology-drive"
import uri from "./uri"
import webdav from "./webdav"

export const pluginsByType = {
  DRIVE: google,
  URI: uri,
  dropbox,
  file,
  "synology-drive": synologyDrive,
  webdav,
}

export type Plugin = (typeof pluginsByType)[keyof typeof pluginsByType]

export const plugins = Object.values(pluginsByType)
