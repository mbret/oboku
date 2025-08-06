import { configuration } from "../config/configuration"
import { plugin as googlePlugin } from "./google"
import { plugin as dropboxPlugin } from "./dropbox"
import type { Plugin } from "./configure"

export const isPluginEnabled = (plugin: Plugin) => {
  switch (plugin.type) {
    case googlePlugin.type:
      return configuration.FEATURE_GOOGLE_DRIVE_ENABLED
    case dropboxPlugin.type:
      return configuration.FEATURE_DROPBOX_ENABLED
    default:
      return true
  }
}

export const useIsPluginEnabled = (plugin: Plugin) => {
  return isPluginEnabled(plugin)
}
