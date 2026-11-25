import type nano from "nano"
import type { SourcePlugin, SyncContext } from "../../plugins/types.js"

export type Context = SyncContext & {
  db: nano.DocumentScope<unknown>
  userNameHex: string
  email: string
  plugin: SourcePlugin
  refreshBookMetadata: (opts: { bookId: string }) => Promise<void>
}
