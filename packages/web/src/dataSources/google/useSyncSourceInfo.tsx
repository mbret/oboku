import { DataSourceDocType, dataSourceHelpers, GoogleDriveDataSourceData } from "@oboku/shared";
import { ObokuDataSourcePlugin } from "../types";

export const useSyncSourceInfo: ObokuDataSourcePlugin[`useSyncSourceInfo`] = (syncSource: DataSourceDocType) => {
  const data = dataSourceHelpers.extractSyncSourceData<GoogleDriveDataSourceData>(syncSource)

  return {
    name: data?.folderName
  }
}