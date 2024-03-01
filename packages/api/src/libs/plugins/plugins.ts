import { dataSource as googleDataSource } from "./google"
import { dataSource as dropboxDataSource } from "./dropbox"
import { dataSource as urlDataSource } from "./link"
import { plugin as nhentaiPlugin } from "./nhentai"
import { DataSourcePlugin } from "@libs/plugins/types"

export const plugins: DataSourcePlugin[] = [
  googleDataSource,
  dropboxDataSource,
  urlDataSource,
  nhentaiPlugin
]
