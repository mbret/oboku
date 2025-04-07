import { plugin as dropbox } from "./dropbox"
import { plugin as google } from "./google"
import { plugin as file } from "./local"
import uri from "./uri"
import type { ObokuPlugin } from "./types"
import webdav from "./webdav"

export type Plugin =
  | ObokuPlugin<"dropbox">
  | ObokuPlugin<"DRIVE">
  | ObokuPlugin<"webdav">
  | ObokuPlugin<"file">
  | ObokuPlugin<"URI">

const plugins: Plugin[] = []

plugins.push(file)
plugins.push(dropbox)
plugins.push(google)
plugins.push(uri)
plugins.push(webdav)

export { plugins }
