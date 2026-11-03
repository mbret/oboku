import type { DataSourceType, SettingsConnectorDocType } from "@oboku/shared"

export function findConnector<T extends DataSourceType>(
  connectors: readonly SettingsConnectorDocType[] | undefined,
  id: string | undefined,
  type: T,
) {
  return connectors?.find(
    function isConnectorWithIdAndType(
      connector,
    ): connector is Extract<SettingsConnectorDocType, { type: T }> {
      return connector.id === id && connector.type === type
    },
  )
}
