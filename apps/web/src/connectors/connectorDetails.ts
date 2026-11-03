import type { SettingsConnectorType } from "@oboku/shared"
import {
  getPluginByType,
  isPluginType,
} from "../integrations/plugins/configure"

export const isSettingsConnectorType = (
  type: string | undefined,
): type is SettingsConnectorType =>
  isPluginType(type) && getPluginByType(type).connector !== undefined
