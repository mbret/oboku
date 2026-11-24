import type { SourceType } from "@oboku/shared"
import { dataSource as googleDataSource } from "./google/index.js"
import { dataSource as dropboxDataSource } from "./dropbox/index.js"
import { dataSource as oneDriveDataSource } from "./one-drive/index.js"
import { dataSource as synologyDriveDataSource } from "./synology-drive/index.js"
import { dataSource as urlDataSource } from "./uri/index.js"
import { dataSource as webdavDataSource } from "./webdav/index.js"
import { plugin as filePlugin } from "./file/index.js"
import { dataSource as serverDataSource } from "./server/index.js"
import { dataSource as opdsDataSource } from "./opds/index.js"
import type { SourcePlugin } from "./types.js"

/**
 * Registry keyed by source type so that getPlugin(type) returns
 * SourcePlugin<typeof type> and plugin.sync is correctly typed.
 */
export const plugins: {
  [K in SourceType]: SourcePlugin<K>
} = {
  DRIVE: googleDataSource,
  dropbox: dropboxDataSource,
  "one-drive": oneDriveDataSource,
  "synology-drive": synologyDriveDataSource,
  URI: urlDataSource,
  webdav: webdavDataSource,
  file: filePlugin,
  server: serverDataSource,
  opds: opdsDataSource,
}

/** Returns the plugin for the given source; sync return type is typed per source. */
export function getPlugin<T extends SourceType>(
  type: T,
): SourcePlugin<T> | undefined {
  return plugins[type] as SourcePlugin<T> | undefined
}
