import type { UseLibrarySyncInfo } from "../../plugins/types"
import { useConnector } from "../../../connectors/useConnector"

export const useLibrarySyncInfo: UseLibrarySyncInfo<"opds"> = ({
  librarySync,
  enabled,
}) => {
  const { data: connector } = useConnector({
    id: librarySync?.data_v2?.connectorId,
    enabled,
    type: "opds",
  })

  if (!librarySync) {
    return {
      name: undefined,
    }
  }

  const feedUrl = librarySync.data_v2?.feedUrl ?? ""

  if (!connector || !URL.canParse(feedUrl)) {
    return {
      name: `opds://?`,
    }
  }

  const { host, pathname, search } = new URL(feedUrl)

  return {
    name: `opds://${connector.username}@${host}${pathname}${search}`,
  }
}
