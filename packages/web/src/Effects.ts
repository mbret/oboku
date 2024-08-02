import { useRemoveDownloadWhenBookIsNotInterested } from "./download/useRemoveDownloadWhenBookIsNotInterested"
import { useCleanupDanglingLinks } from "./links/useCleanupDanglingLinks"

export const Effects = () => {
  useCleanupDanglingLinks()
  useRemoveDownloadWhenBookIsNotInterested()

  return null
}
