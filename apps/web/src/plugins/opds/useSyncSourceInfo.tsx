import type { UseSyncSourceInfo } from "../types"
import { useConnector } from "../../connectors/useConnector"

export const useSyncSourceInfo: UseSyncSourceInfo<"opds"> = ({
  dataSource,
  enabled,
}) => {
  const { data: connector } = useConnector({
    id: dataSource?.data_v2?.connectorId,
    enabled,
    type: "opds",
  })

  if (!dataSource) {
    return {
      name: undefined,
    }
  }

  const feedUrl = dataSource.data_v2?.feedUrl ?? ""

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
