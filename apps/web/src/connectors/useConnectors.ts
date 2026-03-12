import type { SettingsConnectorDocType } from "@oboku/shared"
import { isConnectorOfType } from "../rxdb/collections/settings"
import { useSettings } from "../settings/useSettings"

export const useConnectors = <T extends SettingsConnectorDocType["type"]>({
  type,
}: {
  type: T
}) => {
  const { data: settings, ...rest } = useSettings()

  return {
    ...rest,
    data: settings?.connectors?.filter(
      (
        connector,
      ): connector is Extract<SettingsConnectorDocType, { type: T }> =>
        isConnectorOfType(connector, type),
    ),
  }
}
