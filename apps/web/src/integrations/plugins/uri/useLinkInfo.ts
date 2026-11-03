import type { UseLinkInfo } from "../types"

export const useLinkInfo: UseLinkInfo = ({ linkData, enabled }) => {
  const url =
    enabled && linkData && "url" in linkData ? linkData.url : undefined
  const label = url ? url.substring(url.lastIndexOf("/") + 1) || url : undefined

  return {
    data: {
      label,
    },
  }
}
