import type { SourceType } from "@oboku/shared"
import { sourcePlugin as googleSourcePlugin } from "./google/index.js"
import { sourcePlugin as dropboxSourcePlugin } from "./dropbox/index.js"
import { sourcePlugin as oneDriveSourcePlugin } from "./one-drive/index.js"
import { sourcePlugin as synologyDriveSourcePlugin } from "./synology-drive/index.js"
import { sourcePlugin as urlSourcePlugin } from "./uri/index.js"
import { sourcePlugin as webdavSourcePlugin } from "./webdav/index.js"
import { sourcePlugin as fileSourcePlugin } from "./file/index.js"
import { sourcePlugin as serverSourcePlugin } from "./server/index.js"
import { sourcePlugin as opdsSourcePlugin } from "./opds/index.js"
import type { SourcePlugin } from "./types.js"

/**
 * Registry keyed by source type so that getPlugin(type) returns
 * SourcePlugin<typeof type> and plugin.sync is correctly typed.
 */
export const plugins: {
  [K in SourceType]: SourcePlugin<K>
} = {
  DRIVE: googleSourcePlugin,
  dropbox: dropboxSourcePlugin,
  "one-drive": oneDriveSourcePlugin,
  "synology-drive": synologyDriveSourcePlugin,
  URI: urlSourcePlugin,
  webdav: webdavSourcePlugin,
  file: fileSourcePlugin,
  server: serverSourcePlugin,
  opds: opdsSourcePlugin,
}

/** Returns the plugin for the given source; sync return type is typed per source. */
export function getPlugin<T extends SourceType>(
  type: T,
): SourcePlugin<T> | undefined {
  return plugins[type] as SourcePlugin<T> | undefined
}
