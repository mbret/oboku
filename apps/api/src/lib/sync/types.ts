import type nano from "nano"
import { DataSourcePlugin } from "../plugins/types"

export type Context = Parameters<NonNullable<DataSourcePlugin["sync"]>>[0] & {
  db: nano.DocumentScope<unknown>
  authorization: string
  userNameHex: string
  email: string
}
