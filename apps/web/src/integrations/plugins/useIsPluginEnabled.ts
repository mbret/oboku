import { useConfig } from "../../config/useConfig"
import type { Plugin } from "./configure"

export const useGetIsPluginEnabled = () => {
  const { data: config } = useConfig()

  return function getIsPluginEnabled(plugin: Plugin) {
    return plugin.featureFlag ? !!config?.[plugin.featureFlag] : true
  }
}

export const useGetIsPluginVisible = () => {
  const { data: config } = useConfig()
  const isPluginEnabled = useGetIsPluginEnabled()

  return function getIsPluginVisible(plugin: Plugin) {
    return isPluginEnabled(plugin) || !!config?.SHOW_DISABLED_PLUGINS
  }
}
