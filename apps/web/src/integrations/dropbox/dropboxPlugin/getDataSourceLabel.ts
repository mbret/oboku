import type { GetDataSourceLabel } from "../../plugins/types"

export const getDataSourceLabel: GetDataSourceLabel<"dropbox"> =
  function getDropboxDataSourceLabel(dataSource) {
    const folderName = dataSource.data_v2?.folderName?.trim()
    const folderId = dataSource.data_v2?.folderId?.trim()

    if (folderName) {
      return `Dropbox/${folderName}`
    }

    if (folderId) {
      return `Dropbox/${folderId}`
    }

    return "Dropbox"
  }
