import {
  type DataSourceDocType,
  dataSourceHelpers,
  type GoogleDriveDataSourceData,
} from "@oboku/shared"
import type { ObokuPlugin } from "../types"

export const useSyncSourceInfo: ObokuPlugin[`useSyncSourceInfo`] = (
  syncSource: DataSourceDocType,
) => {
  const data =
    dataSourceHelpers.extractSyncSourceData<GoogleDriveDataSourceData>(
      syncSource,
    )

  return {
    name: data?.folderName,
  }
}
