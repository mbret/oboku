import type { UseSyncSourceInfo } from "../types"
import { useConnector } from "../../connectors/useConnector"

export const useSyncSourceInfo: UseSyncSourceInfo<"server"> = ({
  dataSource,
  enabled,
}) => {
  const { data: connector } = useConnector({
    id: dataSource?.data_v2?.connectorId,
    enabled,
    type: "server",
  })

  if (!dataSource || !connector) {
    return { name: undefined }
  }

  return {
    name: `server://${connector.username}`,
  }
}
