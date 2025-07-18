import { dataSourceHelpers } from "@oboku/shared"
import type { UseSyncSourceInfo } from "../types"

export const useSyncSourceInfo: UseSyncSourceInfo<"DRIVE"> = (syncSource) => {
  const data = syncSource
    ? dataSourceHelpers.getDataFromDataSource<"DRIVE">(syncSource)
    : undefined

  return {
    name: data?.folderName,
  }
}
