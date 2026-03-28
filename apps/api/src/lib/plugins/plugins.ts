import type { DataSourceType } from "@oboku/shared"
import { dataSource as googleDataSource } from "./google"
import { dataSource as dropboxDataSource } from "./dropbox"
import { dataSource as synologyDriveDataSource } from "./synology-drive"
import { dataSource as urlDataSource } from "./uri"
import { dataSource as webdavDataSource } from "./webdav"
import { plugin as filePlugin } from "./file"
import { dataSource as serverDataSource } from "./server"
import type { DataSourcePlugin } from "src/lib/plugins/types"

/**
 * Registry keyed by provider type so that getPlugin(type) returns
 * DataSourcePlugin<typeof type> and plugin.sync is correctly typed.
 */
export const plugins: {
  [K in DataSourceType]: DataSourcePlugin<K>
} = {
  DRIVE: googleDataSource,
  dropbox: dropboxDataSource,
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
