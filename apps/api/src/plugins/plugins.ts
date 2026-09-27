import type { DataSourceType } from "@oboku/shared"
import { dataSource as googleDataSource } from "./google/index.js"
import { dataSource as dropboxDataSource } from "./dropbox/index.js"
import { dataSource as oneDriveDataSource } from "./one-drive/index.js"
import { dataSource as synologyDriveDataSource } from "./synology-drive/index.js"
import { dataSource as urlDataSource } from "./uri/index.js"
import { dataSource as webdavDataSource } from "./webdav/index.js"
import { plugin as filePlugin } from "./file/index.js"
import { dataSource as serverDataSource } from "./server/index.js"
import type { DataSourcePlugin } from "./types.js"

/**
 * Registry keyed by provider type so that getPlugin(type) returns
 * DataSourcePlugin<typeof type> and plugin.sync is correctly typed.
 */
export const plugins: {
  [K in DataSourceType]: DataSourcePlugin<K>
} = {
  DRIVE: googleDataSource,
  dropbox: dropboxDataSource,
  "one-drive": oneDriveDataSource,
  "synology-drive": synologyDriveDataSource,
  URI: urlDataSource,
  webdav: webdavDataSource,
  file: filePlugin,
  server: serverDataSource,
}

/** Returns the plugin for the given provider; sync return type is typed per provider. */
export function getPlugin<T extends DataSourceType>(
  type: T,
): DataSourcePlugin<T> | undefined {
  return plugins[type] as DataSourcePlugin<T> | undefined
}
