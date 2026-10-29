import type { UseLinkInfo } from "../../plugins/types"

export const useLinkInfo: UseLinkInfo = ({ linkData, enabled }) => {
  const label =
    enabled && linkData && "entryId" in linkData ? linkData.title : undefined

  return {
    data: {
      label,
    },
  }
}
