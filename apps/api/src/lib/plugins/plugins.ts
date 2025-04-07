import { dataSource as googleDataSource } from "./google"
import { dataSource as dropboxDataSource } from "./dropbox"
import { dataSource as urlDataSource } from "./uri"
import { dataSource as webdavDataSource } from "./webdav"
import { plugin as filePlugin } from "./file"
import type { DataSourcePlugin } from "src/lib/plugins/types"

export const plugins: DataSourcePlugin[] = [
  googleDataSource,
  dropboxDataSource,
  urlDataSource,
  webdavDataSource,
  filePlugin,
]
