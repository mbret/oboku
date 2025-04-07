import { dataSourceHelpers } from "@oboku/shared"
import type { UseSyncSourceInfo } from "../types"

export const useSyncSourceInfo: UseSyncSourceInfo<"webdav"> = (syncSource) => {
  const data = dataSourceHelpers.getDataFromDataSource<"webdav">(syncSource)

  const url = new URL(data?.url ?? "")
  const cleanUrl = url.hostname

  return {
    name: `webdav://${data?.username}@${cleanUrl}${data?.directory ?? "/"}`,
  }
}
