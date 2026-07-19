import { useConfig } from "../config/useConfig"
import { plugin as googlePlugin } from "./google"
import { plugin as dropboxPlugin } from "./dropbox"
import { plugin as oneDrivePlugin } from "./one-drive"
import { plugin as serverPlugin } from "./server"
import type { Plugin } from "./configure"

export const useGetIsPluginEnabled = () => {
  const { data: config } = useConfig()

  return function getIsPluginEnabled(plugin: Plugin) {
    switch (plugin.type) {
      case googlePlugin.type:
        return !!config?.FEATURE_GOOGLE_DRIVE_ENABLED
      case dropboxPlugin.type:
        return !!config?.FEATURE_DROPBOX_ENABLED
      case oneDrivePlugin.type:
        return !!config?.FEATURE_ONE_DRIVE_ENABLED
      case serverPlugin.type:
        return !!config?.FEATURE_SERVER_SYNC_ENABLED
      default:
        return true
    }
  }
}

export const useGetIsPluginVisible = () => {
  const { data: config } = useConfig()
  const isPluginEnabled = useGetIsPluginEnabled()

  return function getIsPluginVisible(plugin: Plugin) {
    return isPluginEnabled(plugin) || !!config?.SHOW_DISABLED_PLUGINS
  }
}
