import type { UseSyncSourceInfo } from "../types"
import { useConnector } from "../../connectors/useConnector"

export const useSyncSourceInfo: UseSyncSourceInfo<"webdav"> = ({
  dataSource,
  enabled,
}) => {
  const { data: connector } = useConnector({
    id: dataSource?.data_v2?.connectorId,
    enabled,
    type: "webdav",
  })

  if (!dataSource) {
    return {
      name: undefined,
    }
  }

  const directory = dataSource.data_v2?.directory ?? "/"

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
