import { DataSourceDocType } from "..";

export type DataSourcePlugin = {
  uniqueResourceIdentifier: string,
  name?: string,
  synchronizable?: boolean,
  type: string,
  sensitive?: boolean
}

export type GoogleDriveDataSourceData = {
  applyTags: string[]
  folderId: string
  folderName?: string
};

export type DropboxDataSourceData = {
  folderId: string
  folderName: string
  applyTags: string[]
}

export const dataSourcePlugins: { [key: string]: DataSourcePlugin } = {
  DRIVE: {
    uniqueResourceIdentifier: 'drive',
    type: `DRIVE`
  },
  DROPBOX: {
    uniqueResourceIdentifier: 'dropbox',
    type: `DROPBOX`
  },
  FILE: {
    uniqueResourceIdentifier: 'oboku-file',
    type: `FILE`
  },
  URI: {
    uniqueResourceIdentifier: 'oboku-link',
    type: `URI`
  },
  NHENTAI: {
    uniqueResourceIdentifier: 'nhentai',
    name: `nhentai`,
    synchronizable: false,
    type: `NHENTAI`,
    sensitive: true
  },
}

export const generateResourceId = (uniqueResourceIdentifier: string, resourceId: string) => `${uniqueResourceIdentifier}-${resourceId}`

export const extractIdFromResourceId = (uniqueResourceIdentifier: string, resourceId: string) => resourceId.replace(`${uniqueResourceIdentifier}-`, ``)

export const extractSyncSourceData = <Data extends Record<any, any>>({ data }: DataSourceDocType) => {
  try {
    return JSON.parse(data) as Data
  } catch (e) {
    return undefined
  }
}

export const dataSourceHelpers = {
  generateResourceId,
  extractIdFromResourceId,
  extractSyncSourceData,
}