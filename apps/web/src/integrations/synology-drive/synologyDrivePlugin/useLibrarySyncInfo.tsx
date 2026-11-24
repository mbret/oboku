import type { UseLibrarySyncInfo } from "../../plugins/types"
import { useConnector } from "../../../connectors/useConnector"
import {
  getHostname,
  getLabelWithItemCount,
} from "../../plugins/common/librarySyncLabel"

export const useLibrarySyncInfo: UseLibrarySyncInfo<"synology-drive"> = ({
  librarySync,
  enabled,
}) => {
  const { data: connector } = useConnector({
    id: librarySync?.data_v2?.connectorId,
    type: "synology-drive",
    enabled,
  })

  if (!librarySync) {
    return {
      name: undefined,
    }
  }

  const itemsCount = librarySync.data_v2?.items?.length ?? 0

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
