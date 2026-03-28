import { assertNever, type DataSourceDocType } from "@oboku/shared"
import type { DeepReadonly } from "rxdb"
import { pluginsByType } from "./configure"

export const usePluginDataSourceLabel = (
  dataSource?: DeepReadonly<DataSourceDocType> | null,
) => {
  const driveSyncSourceInfo = pluginsByType.DRIVE.useSyncSourceInfo({
    enabled: dataSource?.type === "DRIVE",
    dataSource: dataSource ?? undefined,
  })
  const dropboxSyncSourceInfo = pluginsByType.dropbox.useSyncSourceInfo({
    enabled: dataSource?.type === "dropbox",
    dataSource: dataSource ?? undefined,
  })
  const fileSyncSourceInfo = pluginsByType.file.useSyncSourceInfo({
    enabled: dataSource?.type === "file",
    dataSource: dataSource ?? undefined,
  })
  const synologyDriveSyncSourceInfo = pluginsByType[
    "synology-drive"
  ].useSyncSourceInfo({
    enabled: dataSource?.type === "synology-drive",
    dataSource: dataSource ?? undefined,
  })
  const uriSyncSourceInfo = pluginsByType.URI.useSyncSourceInfo({
    enabled: dataSource?.type === "URI",
    dataSource: dataSource ?? undefined,
  })
  const webdavSyncSourceInfo = pluginsByType.webdav.useSyncSourceInfo({
    enabled: dataSource?.type === "webdav",
    dataSource: dataSource ?? undefined,
  })
  const serverSyncSourceInfo = pluginsByType.server.useSyncSourceInfo({
    enabled: dataSource?.type === "server",
    dataSource: dataSource ?? undefined,
  })

  const dataSourceType = dataSource?.type

  switch (dataSourceType) {
    case "DRIVE":
      return driveSyncSourceInfo?.name
    case "webdav":
      return webdavSyncSourceInfo?.name
    case "dropbox":
      return dropboxSyncSourceInfo?.name
    case "synology-drive":
      return synologyDriveSyncSourceInfo?.name
    case "file":
      return fileSyncSourceInfo?.name
    case "URI":
      return uriSyncSourceInfo?.name
    case "server":
      return serverSyncSourceInfo?.name
    case undefined:
      return undefined
    default:
      return assertNever(dataSourceType)
  }
}
