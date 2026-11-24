import { plugins } from "../integrations/plugins/configure"
import { useMemo } from "react"

export const useSourcePlugin = (type?: string) =>
  useMemo(() => getSourcePlugin(type), [type])

export const getSourcePlugin = (type?: string) =>
  plugins.find((plugin) => plugin.type === type)
