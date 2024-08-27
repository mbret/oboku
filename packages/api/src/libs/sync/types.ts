import { DataSourcePlugin } from "@libs/plugins/types"
import nano from "nano"

export type Context = Parameters<NonNullable<DataSourcePlugin["sync"]>>[0] & {
  db: nano.DocumentScope<unknown>
  authorization: string
}
