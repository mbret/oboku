import { plugin as dropbox } from "./dropbox"
import { plugin as google } from "./google"
import { plugin as file } from "./local"
import { plugin as server } from "./server"
import { plugin as synologyDrive } from "./synology-drive"
import uri from "./uri"
import webdav from "./webdav"

export const pluginsByType = {
  DRIVE: google,
  URI: uri,
  dropbox,
  file,
  server,
  "synology-drive": synologyDrive,
  webdav,
}

export type Plugin = (typeof pluginsByType)[keyof typeof pluginsByType]

export const plugins = Object.values(pluginsByType)
