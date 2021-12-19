export enum DataSourceType {
  URI = "URI",
  DRIVE = "DRIVE",
  DROPBOX = "DROPBOX",
  FILE = 'FILE',
  NHENTAI = `NHENTAI`
}

export const dataSourcePlugins = {
  [DataSourceType.DRIVE]: {
    uniqueResourceIdentifier: 'drive',
    type: DataSourceType.DRIVE
  },
  [DataSourceType.DROPBOX]: {
    uniqueResourceIdentifier: 'dropbox',
    type: DataSourceType.DROPBOX
  },
  [DataSourceType.FILE]: {
    uniqueResourceIdentifier: 'oboku-file',
    type: DataSourceType.FILE
  },
  [DataSourceType.URI]: {
    uniqueResourceIdentifier: 'oboku-link',
    type: DataSourceType.URI
  },
  [DataSourceType.NHENTAI]: {
    uniqueResourceIdentifier: 'nhentai',
    name: `nhentai`,
    synchronizable: false,
    type: DataSourceType.NHENTAI
  },
}

export const generateResourceId = (uniqueResourceIdentifier: string, resourceId: string) => `${uniqueResourceIdentifier}-${resourceId}`

export const extractIdFromResourceId = (uniqueResourceIdentifier: string, resourceId: string) => resourceId.replace(`${uniqueResourceIdentifier}-`, ``)

export const dataSourceHelpers = {
  generateResourceId,
  extractIdFromResourceId,
}