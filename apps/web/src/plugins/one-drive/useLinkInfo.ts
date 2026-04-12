import type { UseLinkInfo } from "../types"

export const useLinkInfo: UseLinkInfo = ({ enabled, linkData }) => {
  const fileId =
    enabled && linkData && "fileId" in linkData ? linkData.fileId : undefined

  return {
    data: {
      label: fileId ? `ID: ${fileId}` : undefined,
    },
  }
}
