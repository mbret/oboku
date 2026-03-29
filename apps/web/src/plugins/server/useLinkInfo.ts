import type { UseLinkInfo } from "../types"

export const useLinkInfo: UseLinkInfo = ({ linkData, enabled }) => {
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
