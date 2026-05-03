import type { UseLinkInfo } from "../types"

/**
 * Shared `useLinkInfo` implementation for plugins whose `linkData` exposes a
 * `filePath` field (Server, WebDAV).
 */
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
