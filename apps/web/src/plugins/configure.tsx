import { plugin as dropbox } from "./dropbox"
import { plugin as google } from "./google"
import { plugin as file } from "./local"
import uri from "./uri"
import type { ObokuPlugin } from "./types"
import webdav from "./webdav"

export type Plugin = ObokuPlugin<
  "dropbox" | "DRIVE" | "webdav" | "file" | "URI"
>

const plugins: Plugin[] = []

plugins.push(file as Plugin)
plugins.push(dropbox as Plugin)
plugins.push(google as Plugin)
plugins.push(uri as Plugin)
plugins.push(webdav as Plugin)

export { plugins }
