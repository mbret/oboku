export enum DataSourceType {
  URI = "URI",
  DRIVE = "DRIVE",
  DROPBOX = "DROPBOX",
  FILE = 'FILE',
  NHENTAI = `NHENTAI`
}

export const dataSourcePlugins = {
  [DataSourceType.DRIVE]: {
    uniqueResourceIdentifier: 'drive'
  },
  [DataSourceType.DROPBOX]: {
    uniqueResourceIdentifier: 'dropbox'
  },
  [DataSourceType.FILE]: {
    uniqueResourceIdentifier: 'oboku-file'
  },
  [DataSourceType.URI]: {
    uniqueResourceIdentifier: 'oboku-link'
  },
  [DataSourceType.NHENTAI]: {
    uniqueResourceIdentifier: 'nhentai',
    name: `nhentai`,
    synchronizable: false,
    type: DataSourceType.NHENTAI
  },
}