import type { UseLibrarySyncInfo } from "../../plugins/types"
import { useConnector } from "../../../connectors/useConnector"

export const useLibrarySyncInfo: UseLibrarySyncInfo<"server"> = ({
  librarySync,
  enabled,
}) => {
  const { data: connector } = useConnector({
    id: librarySync?.data_v2?.connectorId,
    enabled,
    type: "server",
  })

  if (!librarySync || !connector) {
    return { name: undefined }
  }

  return {
    name: `server://${connector.username}`,
  }
}
