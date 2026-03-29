import { explodeServerResourceId } from "@oboku/shared"
import type { UseLinkInfo } from "../types"

export const useLinkInfo: UseLinkInfo = ({ resourceId, enabled }) => {
  const { filePath } =
    enabled && resourceId
      ? explodeServerResourceId(resourceId)
      : { filePath: undefined }

  return {
    data: {
      label: filePath,
    },
  }
}
