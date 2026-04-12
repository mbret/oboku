import type { UseSyncSourceInfo } from "../types"

export const useSyncSourceInfo: UseSyncSourceInfo<"dropbox"> = ({
  dataSource,
  enabled,
}) => {
  if (!dataSource || !enabled) {
    return {
      name: undefined,
    }
  }

  const folderName = dataSource.data_v2?.folderName?.trim()
  const folderId = dataSource.data_v2?.folderId?.trim()

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
