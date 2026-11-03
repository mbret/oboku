import type { SettingsConnectorDocType } from "@oboku/shared"
import { useSettings } from "../settings/useSettings"
import { findConnector } from "./findConnector"

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
    data: findConnector(settings?.connectors, id, type),
  }
}
