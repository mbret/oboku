import type {
  DataSourceDocType,
  DataSourceDocTypeFor,
  DataSourceType,
  SettingsConnectorDocType,
} from "@oboku/shared"
import type { DeepReadonly } from "rxdb"
import { useSettings } from "../../settings/useSettings"
import { getPluginByType } from "./configure"

function getDataSourceLabel<T extends DataSourceType>(
  type: T,
  dataSource: DeepReadonly<DataSourceDocTypeFor<T>>,
  connectors: readonly SettingsConnectorDocType[],
) {
  const connectorId = getConnectorId(dataSource)
  const connector = connectors.find(
    function isDataSourceConnector(
      candidate,
    ): candidate is Extract<SettingsConnectorDocType, { type: T }> {
      return candidate.id === connectorId && candidate.type === type
    },
  )

  return getPluginByType(type).getDataSourceLabel(dataSource, connector)
}

function getConnectorId(dataSource: DeepReadonly<DataSourceDocType>) {
  return dataSource.data_v2 && "connectorId" in dataSource.data_v2
    ? dataSource.data_v2.connectorId
    : undefined
}

export const usePluginDataSourceLabel = (
  dataSource?: DeepReadonly<DataSourceDocType> | null,
) => {
  const hasConnector = !!dataSource && getConnectorId(dataSource) !== undefined
  const { data: settings } = useSettings({ enabled: hasConnector })

  if (!dataSource) {
    return undefined
  }

  return getDataSourceLabel(
    dataSource.type,
    dataSource,
    settings?.connectors ?? [],
  )
}
