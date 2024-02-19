import { plugins } from "../plugins/configure"

export const getDataSourcePlugin = (type?: string) =>
  plugins.find((plugin) => plugin.type === type)
