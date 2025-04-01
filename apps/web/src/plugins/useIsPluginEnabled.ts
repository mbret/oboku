import { configuration } from "../config/configuration"
import type { ObokuPlugin } from "./types"
import { plugin as googlePlugin } from "./google"
import { plugin as dropboxPlugin } from "./dropbox"

export const isPluginEnabled = (plugin: ObokuPlugin) => {
  switch (plugin.type) {
    case googlePlugin.type:
      return configuration.FEATURE_GOOGLE_DRIVE_ENABLED
    case dropboxPlugin.type:
      return configuration.FEATURE_DROPBOX_ENABLED
    default:
      return true
  }
}

export const useIsPluginEnabled = (plugin: ObokuPlugin) => {
  return isPluginEnabled(plugin)
}
