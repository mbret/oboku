import type { UseSyncSourceInfo } from "../types"
import { useConnector } from "../../connectors/useConnector"

export const useSyncSourceInfo: UseSyncSourceInfo<"webdav"> = (syncSource) => {
  const { data: connector } = useConnector({
    id: syncSource?.data_v2?.connectorId,
    type: "webdav",
  })
  const directory = syncSource?.data_v2?.directory ?? "/"

  if (!connector) {
    return {
      name: `webdav://?`,
    }
  }

  const url = new URL(connector?.url ?? "")
  const cleanUrl = url.hostname

  return {
    name: `webdav://${connector?.username}@${cleanUrl}${directory}`,
  }
}
