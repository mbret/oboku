import type { UseLinkInfo } from "../types"

export const useFileIdLinkInfo: UseLinkInfo = ({ linkData, enabled }) => {
  const fileId =
    enabled && linkData && "fileId" in linkData ? linkData.fileId : undefined

  return {
    data: {
      label: fileId ? `ID: ${fileId}` : undefined,
    },
  }
}

export const useFilePathLinkInfo: UseLinkInfo = ({ linkData, enabled }) => {
  const filePath =
    enabled && linkData && "filePath" in linkData
      ? linkData.filePath
      : undefined

  return {
    data: {
      label: filePath,
    },
  }
}
