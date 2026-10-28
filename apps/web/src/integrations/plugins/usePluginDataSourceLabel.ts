import {
  assertNever,
  type DataSourceDocType,
  type DataSourceDocTypeFor,
} from "@oboku/shared"
import type { DeepReadonly } from "rxdb"
import { pluginsByType } from "./configure"

// TypeScript cannot narrow a generic discriminated-union parameter via
// control flow, so the runtime guard + assertion is the only safe option.
const syncSourceArgs = <T extends DataSourceDocType["type"]>(
  dataSource: DeepReadonly<DataSourceDocType> | null | undefined,
  type: T,
) => {
  const narrowed = (dataSource?.type === type ? dataSource : undefined) as
    | DeepReadonly<DataSourceDocTypeFor<T>>
    | undefined

  return { enabled: !!narrowed, dataSource: narrowed }
}

export const usePluginDataSourceLabel = (
  dataSource?: DeepReadonly<DataSourceDocType> | null,
) => {
  const drive = pluginsByType.DRIVE.useSyncSourceInfo(
    syncSourceArgs(dataSource, "DRIVE"),
  )
  const dropbox = pluginsByType.dropbox.useSyncSourceInfo(
    syncSourceArgs(dataSource, "dropbox"),
  )
  const oneDrive = pluginsByType["one-drive"].useSyncSourceInfo(
    syncSourceArgs(dataSource, "one-drive"),
  )
  const file = pluginsByType.file.useSyncSourceInfo(
    syncSourceArgs(dataSource, "file"),
  )
  const synologyDrive = pluginsByType["synology-drive"].useSyncSourceInfo(
    syncSourceArgs(dataSource, "synology-drive"),
  )
  const uri = pluginsByType.URI.useSyncSourceInfo(
    syncSourceArgs(dataSource, "URI"),
  )
  const webdav = pluginsByType.webdav.useSyncSourceInfo(
    syncSourceArgs(dataSource, "webdav"),
  )
  const server = pluginsByType.server.useSyncSourceInfo(
    syncSourceArgs(dataSource, "server"),
  )

  const dataSourceType = dataSource?.type

  switch (dataSourceType) {
    case "DRIVE":
      return drive?.name
    case "dropbox":
      return dropbox?.name
    case "one-drive":
      return oneDrive?.name
    case "file":
      return file?.name
    case "synology-drive":
      return synologyDrive?.name
    case "URI":
      return uri?.name
    case "webdav":
      return webdav?.name
    case "server":
      return server?.name
    case undefined:
      return undefined
    default:
      return assertNever(dataSourceType)
  }
}
