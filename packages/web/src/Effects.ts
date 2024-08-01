import { useDownloadsEffects } from "./download/effects"
import { useCleanupDanglingLinks } from "./links/useCleanupDanglingLinks"
  
const effects = [useDownloadsEffects]

export const Effects = () => {
  effects.forEach((effectHook) => effectHook())

  useCleanupDanglingLinks()

  return null
}
