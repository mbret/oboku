import { configuration } from "../config/configuration"
import { plugin as googlePlugin } from "./google"
import { plugin as dropboxPlugin } from "./dropbox"
import { plugin as serverPlugin } from "./server"
import type { Plugin } from "./configure"

const isPluginEnabled = (plugin: Plugin) => {
  switch (plugin.type) {
    case googlePlugin.type:
      return configuration.FEATURE_GOOGLE_DRIVE_ENABLED
    case dropboxPlugin.type:
      return configuration.FEATURE_DROPBOX_ENABLED
    case serverPlugin.type:
      return configuration.FEATURE_SERVER_SYNC_ENABLED
    default:
      return true
  }
}

const isPluginVisible = (plugin: Plugin) =>
  isPluginEnabled(plugin) || configuration.SHOW_DISABLED_PLUGINS

export const useGetIsPluginVisible = () => {
  return isPluginVisible
}

export const useGetIsPluginEnabled = () => {
  return isPluginEnabled
}
