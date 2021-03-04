import { DataSourceType } from "./docTypes";

export const plugins = {
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
}