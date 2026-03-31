import type { UseSyncSourceInfo } from "../types"
import { useConnector } from "../../connectors/useConnector"

export const useSyncSourceInfo: UseSyncSourceInfo<"server"> = ({
  dataSource,
  enabled,
}) => {
  const serverDataSource =
    enabled && dataSource?.type === "server" ? dataSource : undefined

  const { data: connector } = useConnector({
    id: serverDataSource?.data_v2?.connectorId,
    enabled,
    type: "server",
  })

  if (!serverDataSource || !connector) {
    return { name: undefined }
  }

  return {
    name: `server://${connector.username}`,
  }
}
