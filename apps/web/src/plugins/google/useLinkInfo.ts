import type { UseLinkInfo } from "../types"
import { explodeGoogleDriveResourceId } from "@oboku/shared"

export const useLinkInfo: UseLinkInfo = ({ resourceId, enabled }) => {
  const id =
    enabled && resourceId
      ? explodeGoogleDriveResourceId(resourceId).fileId
      : undefined

  return {
    data: {
      label: `ID: ${id}`,
    },
  }
}
