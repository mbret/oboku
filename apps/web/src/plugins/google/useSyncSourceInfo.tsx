import type { UseSyncSourceInfo } from "../types"

const getItemLabel = (count: number) =>
  count === 1 ? "1 item" : `${count} items`

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
    name:
      itemsCount > 0
        ? `Google Drive (${getItemLabel(itemsCount)})`
        : "Google Drive",
  }
}
