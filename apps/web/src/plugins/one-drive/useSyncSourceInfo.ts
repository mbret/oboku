import type { UseSyncSourceInfo } from "../types"
import { ONE_DRIVE_PLUGIN_NAME } from "./constants"

const getItemLabel = (count: number) =>
  count === 1 ? "1 item" : `${count} items`

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
    name:
      itemsCount > 0
        ? `${ONE_DRIVE_PLUGIN_NAME} (${getItemLabel(itemsCount)})`
        : ONE_DRIVE_PLUGIN_NAME,
  }
}
