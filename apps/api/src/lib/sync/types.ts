import type nano from "nano"
import type { DataSourcePlugin, SyncContext } from "../plugins/types"

export type Context = SyncContext & {
  db: nano.DocumentScope<unknown>
  userNameHex: string
  email: string
  plugin: DataSourcePlugin
}
