import type { UseLinkInfo } from "../types"

export const useLinkInfo: UseLinkInfo = ({ linkData, enabled }) => {
  const fileId =
    enabled && linkData && "fileId" in linkData ? linkData.fileId : undefined

  return {
    data: {
      label: fileId ? `ID: ${fileId}` : undefined,
    },
  }
}
