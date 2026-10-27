import type { UseSyncSourceInfo } from "../types"
import { getLabelWithItemCount } from "../common/syncSourceLabel"

export const useSyncSourceInfo: UseSyncSourceInfo<"DRIVE"> = ({
  dataSource,
  enabled,
}) => {
  if (!dataSource || !enabled) {
    return {
      name: undefined,
    }
  }

  const itemsCount = dataSource.data_v2?.items?.length ?? 0

  return {
    name: getLabelWithItemCount("Google Drive", itemsCount),
  }
}
