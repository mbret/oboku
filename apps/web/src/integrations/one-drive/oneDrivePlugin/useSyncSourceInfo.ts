import type { UseSyncSourceInfo } from "../../../plugins/types"
import { getLabelWithItemCount } from "../../../plugins/common/syncSourceLabel"
import { ONE_DRIVE_PLUGIN_NAME } from "./constants"

export const useSyncSourceInfo: UseSyncSourceInfo<"one-drive"> = ({
  dataSource,
  enabled,
}) => {
  if (!dataSource || !enabled) {
    return {
      name: undefined,
    }
  }

  const itemsCount = dataSource?.data_v2?.items?.length ?? 0

  return {
    name: getLabelWithItemCount(ONE_DRIVE_PLUGIN_NAME, itemsCount),
  }
}
