import { effects as datasourceEffects } from "./dataSources/effects"
import { useDownloadsEffects } from "./download/effects"
import { useCleanupDanglingLinks } from "./links/useCleanupDanglingLinks"

const effects = [...datasourceEffects, useDownloadsEffects]

export const Effects = () => {
  effects.forEach((effectHook) => effectHook())

  useCleanupDanglingLinks()

  return null
}
