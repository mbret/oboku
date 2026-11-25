import type { UseLibrarySyncInfo } from "../../plugins/types"

export const useLibrarySyncInfo: UseLibrarySyncInfo<"dropbox"> = ({
  librarySync,
  enabled,
}) => {
  if (!librarySync || !enabled) {
    return {
      name: undefined,
    }
  }

  const folderName = librarySync.data_v2?.folderName?.trim()
  const folderId = librarySync.data_v2?.folderId?.trim()

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
