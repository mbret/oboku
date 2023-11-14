import {
  DataSourceDocType,
  dataSourceHelpers,
  GoogleDriveDataSourceData
} from "@oboku/shared"
import { ObokuPlugin } from "../plugin-front"

export const useSyncSourceInfo: ObokuPlugin[`useSyncSourceInfo`] = (
  syncSource: DataSourceDocType
) => {
  const data =
    dataSourceHelpers.extractSyncSourceData<GoogleDriveDataSourceData>(
      syncSource
    )

  return {
    name: data?.folderName
  }
}
