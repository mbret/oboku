import type { SettingsConnectorDocType } from "@oboku/shared"
import { isConnectorOfType } from "../rxdb/collections/settings"
import { useSettings } from "../settings/useSettings"

export const useConnector = <T extends SettingsConnectorDocType["type"]>({
  id,
  type,
}: {
  id?: string
  type: T
}) => {
  const { data: settings, ...rest } = useSettings()

  return {
    ...rest,
    data: id
      ? settings?.connectors?.find(
          (
            connector,
          ): connector is Extract<SettingsConnectorDocType, { type: T }> =>
            connector.id === id && isConnectorOfType(connector, type),
        )
      : undefined,
  }
}
