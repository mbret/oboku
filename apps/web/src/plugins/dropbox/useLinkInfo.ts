import type { UseLinkInfo } from "../types"
import { explodeDropboxResourceId } from "@oboku/shared"

export const useLinkInfo: UseLinkInfo = ({ resourceId, enabled }) => {
  const id =
    enabled && resourceId
      ? explodeDropboxResourceId(resourceId).fileId
      : undefined

  return {
    data: {
      label: `ID: ${id}`,
    },
  }
}
