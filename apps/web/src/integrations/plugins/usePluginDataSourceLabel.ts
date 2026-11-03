import type {
  DataSourceDocType,
  DataSourceDocTypeFor,
  DataSourceType,
  SettingsConnectorDocType,
} from "@oboku/shared"
import type { DeepReadonly } from "rxdb"
import { findConnector } from "../../connectors/findConnector"
import { isSettingsConnectorType } from "../../connectors/connectorDetails"
import { useSettings } from "../../settings/useSettings"
import { getPluginByType } from "./configure"

function getConnectorId(dataSource: DeepReadonly<DataSourceDocType>) {
  const connectorId =
    dataSource.data_v2 && "connectorId" in dataSource.data_v2
      ? dataSource.data_v2.connectorId
      : undefined

  return typeof connectorId === "string" ? connectorId : undefined
}

function getPluginDataSourceLabel<T extends DataSourceType>(
  type: T,
  dataSource: DeepReadonly<DataSourceDocTypeFor<T>>,
  connectors: readonly SettingsConnectorDocType[] | undefined,
) {
  const connector = findConnector(connectors, getConnectorId(dataSource), type)

  return getPluginByType(type).getDataSourceLabel(dataSource, connector)
}

export const usePluginDataSourceLabel = (
  dataSource?: DeepReadonly<DataSourceDocType> | null,
) => {
  const { data: settings } = useSettings({
    enabled: isSettingsConnectorType(dataSource?.type),
  })

  if (!dataSource) {
    return undefined
  }

  return getPluginDataSourceLabel(
    dataSource.type,
    dataSource,
    settings?.connectors,
  )
}
