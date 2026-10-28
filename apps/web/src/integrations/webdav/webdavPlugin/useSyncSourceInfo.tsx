import type { UseSyncSourceInfo } from "../../plugins/types"
import { useConnector } from "../../../connectors/useConnector"
import { getHostname } from "../../plugins/common/syncSourceLabel"

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

  const hostname = getHostname(connector.url)

  if (!hostname) {
    return {
      name: `webdav://?`,
    }
  }

  return {
    name: `webdav://${connector.username}@${hostname}${directory}`,
  }
}
