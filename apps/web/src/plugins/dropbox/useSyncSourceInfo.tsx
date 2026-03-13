import type { UseSyncSourceInfo } from "../types"

export const useSyncSourceInfo: UseSyncSourceInfo<"dropbox"> = ({
  dataSource,
  enabled,
}) => {
  const dropboxDataSource =
    enabled && dataSource?.type === "dropbox" ? dataSource : undefined

  if (!dropboxDataSource) {
    return {
      name: undefined,
    }
  }

  const folderName = dropboxDataSource.data_v2?.folderName?.trim()
  const folderId = dropboxDataSource.data_v2?.folderId?.trim()

  if (folderName) {
    return {
      name: `Dropbox/${folderName}`,
    }
  }

  if (folderId) {
    return {
      name: `Dropbox/${folderId}`,
    }
  }

  return {
    name: "Dropbox",
  }
}
