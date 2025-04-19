import { explodeWebdavResourceId } from "@oboku/shared"
import type { UseLinkInfo } from "../types"

export const useLinkInfo: UseLinkInfo = ({ resourceId, enabled }) => {
  const { filename, url } =
    enabled && resourceId
      ? (explodeWebdavResourceId(resourceId) ?? {})
      : {}

  return {
    data: {
      label: `${url}${filename}`,
    },
  }
}
