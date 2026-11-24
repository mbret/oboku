import type { UseSyncSourceInfo } from "../../plugins/types"
import { useConnector } from "../../../connectors/useConnector"
import {
  getHostname,
  getLabelWithItemCount,
} from "../../plugins/common/syncSourceLabel"

export const useSyncSourceInfo: UseSyncSourceInfo<"synology-drive"> = ({
  dataSource,
  enabled,
}) => {
  const { data: connector } = useConnector({
    id: dataSource?.data_v2?.connectorId,
    type: "synology-drive",
    enabled,
  })

  if (!dataSource) {
    return {
      name: undefined,
    }
  }

  const itemsCount = dataSource.data_v2?.items?.length ?? 0

  if (!connector) {
    return {
      name: getLabelWithItemCount("Synology Drive", itemsCount),
    }
  }

  const hostname = getHostname(connector.url)

  if (!hostname) {
    return {
      name: getLabelWithItemCount("Synology Drive", itemsCount),
    }
  }

  const baseLabel = `synology://${connector.username}@${hostname}`

  return {
    name: getLabelWithItemCount(baseLabel, itemsCount),
  }
}
