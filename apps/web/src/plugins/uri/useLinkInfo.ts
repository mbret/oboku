import type { UseLinkInfo } from "../types"
import { explodeUriResourceId } from "@oboku/shared"

export const useLinkInfo: UseLinkInfo = ({ resourceId, enabled }) => {
  const downloadLink =
    enabled && resourceId ? explodeUriResourceId(resourceId).url : undefined
  const label = downloadLink
    ? downloadLink.substring(downloadLink.lastIndexOf("/") + 1) || downloadLink
    : undefined

  return {
    data: {
      label,
    },
  }
}
