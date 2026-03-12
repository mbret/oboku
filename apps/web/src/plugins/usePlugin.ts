import { useMemo } from "react"
import { getPluginFromType } from "./getPluginFromType"

export const usePlugin = (type?: string) =>
  useMemo(() => getPluginFromType(type), [type])
