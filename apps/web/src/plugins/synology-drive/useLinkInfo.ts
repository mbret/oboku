import { explodeSynologyDriveResourceId } from "@oboku/shared"
import type { UseLinkInfo } from "../types"

export const useLinkInfo: UseLinkInfo = ({ enabled, resourceId }) => {
  const { fileId } =
    enabled && resourceId
      ? explodeSynologyDriveResourceId(resourceId)
      : { fileId: undefined }

  return {
    data: {
      label: fileId ? `ID: ${fileId}` : undefined,
    },
  }
}
