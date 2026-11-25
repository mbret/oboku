import type { UseLibrarySyncInfo } from "../../plugins/types"
import { useConnector } from "../../../connectors/useConnector"
import {
  getHostname,
  getLabelWithLocationCount,
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

  const locationsCount = librarySync.data_v2?.items?.length ?? 0

  if (!connector) {
    return {
      name: getLabelWithLocationCount("Synology Drive", locationsCount),
    }
  }

  const hostname = getHostname(connector.url)

  if (!hostname) {
    return {
      name: getLabelWithLocationCount("Synology Drive", locationsCount),
    }
  }

  const baseLabel = `synology://${connector.username}@${hostname}`

  return {
    name: getLabelWithLocationCount(baseLabel, locationsCount),
  }
}
