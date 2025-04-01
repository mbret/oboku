import { plugins } from "./configure"

export const getPluginFromType = (type?: string) =>
  plugins.find((plugin) => plugin.type === type)
