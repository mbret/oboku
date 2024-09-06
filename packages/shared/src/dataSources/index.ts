import { DataSourceDocType } from "../db/docTypes"

export type GoogleDriveDataSourceData = {
  applyTags: string[]
  folderId: string
  folderName?: string
}

export type DropboxDataSourceData = {
  folderId: string
  folderName: string
  applyTags: string[]
}

export const generateResourceId = (
  uniqueResourceIdentifier: string,
  resourceId: string
) => `${uniqueResourceIdentifier}-${resourceId}`

export const extractIdFromResourceId = (
  uniqueResourceIdentifier: string,
  resourceId: string
) => resourceId.replace(`${uniqueResourceIdentifier}-`, ``)

export const extractSyncSourceData = <Data extends Record<any, any>>({
  data
}: DataSourceDocType) => {
  try {
    return JSON.parse(data) as Data
  } catch (e) {
    return undefined
  }
}

export const dataSourceHelpers = {
  generateResourceId,
  extractIdFromResourceId,
  extractSyncSourceData
}
