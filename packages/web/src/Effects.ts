import { useCleanupDanglingLinks } from "./links/useCleanupDanglingLinks"

export const Effects = () => {
  useCleanupDanglingLinks()

  return null
}
