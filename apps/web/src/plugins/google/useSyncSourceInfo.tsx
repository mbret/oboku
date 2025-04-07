import { dataSourceHelpers } from "@oboku/shared"
import type { UseSyncSourceInfo } from "../types"

export const useSyncSourceInfo: UseSyncSourceInfo<"DRIVE"> = (syncSource) => {
  const data = dataSourceHelpers.getDataFromDataSource<"DRIVE">(syncSource)

  return {
    name: data?.folderName,
  }
}
