import { dataSource as googleDataSource } from "./google"
import { dataSource as dropboxDataSource } from "./dropbox"
import { dataSource as urlDataSource } from "./uri"
import { plugin as nhentaiPlugin } from "./nhentai"
import { plugin as filePlugin } from "./file"
import { DataSourcePlugin } from "@libs/plugins/types"

export const plugins: DataSourcePlugin[] = [
  googleDataSource,
  dropboxDataSource,
  urlDataSource,
  nhentaiPlugin,
  filePlugin
]
