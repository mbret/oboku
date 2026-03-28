import type { UseLinkInfo } from "../types"
import { extractIdFromResourceId } from "@oboku/shared"
import { UNIQUE_RESOURCE_IDENTIFIER } from "./constants"

export const useLinkInfo: UseLinkInfo = ({ resourceId, enabled }) => {
  const downloadLink =
    enabled && resourceId
      ? extractIdFromResourceId(UNIQUE_RESOURCE_IDENTIFIER, resourceId)
      : undefined
  const label = downloadLink
    ? downloadLink.substring(downloadLink.lastIndexOf("/") + 1) || downloadLink
    : undefined

  return {
    data: {
      label,
    },
  }
}
