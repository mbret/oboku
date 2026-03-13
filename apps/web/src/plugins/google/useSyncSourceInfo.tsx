import type { UseSyncSourceInfo } from "../types"

const getItemLabel = (count: number) =>
  count === 1 ? "1 item" : `${count} items`

export const useSyncSourceInfo: UseSyncSourceInfo<"DRIVE"> = ({
  dataSource,
  enabled,
}) => {
  const driveDataSource =
    enabled && dataSource?.type === "DRIVE" ? dataSource : undefined

  if (!driveDataSource) {
    return {
      name: undefined,
    }
  }

  const itemsCount = driveDataSource.data_v2?.items?.length ?? 0

  return {
    name:
      itemsCount > 0
        ? `Google Drive (${getItemLabel(itemsCount)})`
        : "Google Drive",
  }
}
