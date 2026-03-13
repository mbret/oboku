import type { UseSyncSourceInfo } from "../types"
import { useConnector } from "../../connectors/useConnector"

const getItemLabel = (count: number) =>
  count === 1 ? "1 item" : `${count} items`

const getHostname = (urlValue: string) => {
  const trimmedUrlValue = urlValue.trim()

  if (!trimmedUrlValue) {
    return undefined
  }

  try {
    return new URL(trimmedUrlValue).hostname
  } catch {
    try {
      // ConnectorForm accepts host:port values without a scheme, so label
      // rendering needs to retry with a default protocol instead of crashing.
      return new URL(`https://${trimmedUrlValue}`).hostname
    } catch {
      return undefined
    }
  }
}

export const useSyncSourceInfo: UseSyncSourceInfo<"synology-drive"> = ({
  dataSource,
  enabled,
}) => {
  const synologyDriveDataSource =
    enabled && dataSource?.type === "synology-drive" ? dataSource : undefined

  const { data: connector } = useConnector({
    id: synologyDriveDataSource?.data_v2?.connectorId,
    type: "synology-drive",
    enabled,
  })

  if (!synologyDriveDataSource) {
    return {
      name: undefined,
    }
  }

  const itemsCount = synologyDriveDataSource.data_v2?.items?.length ?? 0

  if (!connector) {
    return {
      name:
        itemsCount > 0
          ? `Synology Drive (${getItemLabel(itemsCount)})`
          : "Synology Drive",
    }
  }

  const hostname = getHostname(connector.url)

  if (!hostname) {
    return {
      name:
        itemsCount > 0
          ? `Synology Drive (${getItemLabel(itemsCount)})`
          : "Synology Drive",
    }
  }

  const baseLabel = `synology://${connector.username}@${hostname}`

  return {
    name:
      itemsCount > 0 ? `${baseLabel} (${getItemLabel(itemsCount)})` : baseLabel,
  }
}
