import { dataSource as googleDataSource } from "../dataSources/google"
import { dataSource as dropboxDataSource } from "../dataSources/dropbox"
import { dataSource as urlDataSource } from "../dataSources/link"
import { plugin as nhentaiPlugin } from "../dataSources/nhentai"

export const plugins = [
  googleDataSource,
  dropboxDataSource,
  urlDataSource,
  nhentaiPlugin,
]