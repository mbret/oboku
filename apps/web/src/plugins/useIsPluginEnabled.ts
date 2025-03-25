import { configuration } from "../config/configuration"
import type { ObokuPlugin } from "./types"
import { plugin as googlePlugin } from "./google"

export const isPluginEnabled = (plugin: ObokuPlugin) => {
  switch (plugin.type) {
    case googlePlugin.type:
      return configuration.FEATURE_GOOGLE_DRIVE_ENABLED
    default:
      return true
  }
}

export const useIsPluginEnabled = (plugin: ObokuPlugin) => {
  return isPluginEnabled(plugin)
}
