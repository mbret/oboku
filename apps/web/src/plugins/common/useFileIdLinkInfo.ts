import type { UseLinkInfo } from "../types"

/**
 * Shared `useLinkInfo` implementation for plugins whose `linkData` exposes a
 * `fileId` field (Google Drive, Dropbox, OneDrive, Synology Drive).
 */
export const useFileIdLinkInfo: UseLinkInfo = ({ linkData, enabled }) => {
  const fileId =
    enabled && linkData && "fileId" in linkData ? linkData.fileId : undefined

  return {
    data: {
      label: fileId ? `ID: ${fileId}` : undefined,
    },
  }
}
