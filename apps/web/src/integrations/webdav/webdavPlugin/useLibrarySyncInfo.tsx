import type { UseLibrarySyncInfo } from "../../plugins/types"
import { useConnector } from "../../../connectors/useConnector"
import { getHostname } from "../../plugins/common/librarySyncLabel"

export const useLibrarySyncInfo: UseLibrarySyncInfo<"webdav"> = ({
  librarySync,
  enabled,
}) => {
  const { data: connector } = useConnector({
    id: librarySync?.data_v2?.connectorId,
    enabled,
    type: "webdav",
  })

  if (!librarySync) {
    return {
      name: undefined,
    }
  }

  const directory = librarySync.data_v2?.directory ?? "/"

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
