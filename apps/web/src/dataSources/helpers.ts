import { plugins } from "../plugins/configure"
import { useMemo } from "react"

export const useDataSourcePlugin = (type?: string) =>
  useMemo(() => getDataSourcePlugin(type), [type])

export const getDataSourcePlugin = (type?: string) =>
  plugins.find((plugin) => plugin.type === type)
