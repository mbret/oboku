import { explodeWebdavResourceId } from "@oboku/shared"
import type { UseLinkInfo } from "../types"

export const useLinkInfo: UseLinkInfo = ({ resourceId, enabled }) => {
  const { filePath } =
    enabled && resourceId ? (explodeWebdavResourceId(resourceId) ?? {}) : {}

  return {
    data: {
      label: filePath,
    },
  }
}
