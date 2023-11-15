import { dataSource as googleDataSource } from "../dataSources/google"
import { dataSource as dropboxDataSource } from "../dataSources/dropbox"
import { dataSource as urlDataSource } from "../dataSources/link"
import { plugin as nhentaiPlugin } from "../dataSources/nhentai"
import { plugin as imhentai } from "../../plugins/plugin-imhentai-back"
import { DataSourcePlugin } from "src/plugins/plugin-back"

export const plugins: DataSourcePlugin[] = [
  googleDataSource,
  dropboxDataSource,
  urlDataSource,
  nhentaiPlugin,
  imhentai
]
