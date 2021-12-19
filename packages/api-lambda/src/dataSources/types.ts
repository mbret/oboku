import { Request } from 'request'
import { DataSourceType, LinkDocType } from '@oboku/shared/src'
import { createHelpers } from './helpers';

type NameWithMetadata = string
type ISOString = string

type SynchronizeAbleItem = {
  type: 'file' | 'folder',
  resourceId: string,
  name: NameWithMetadata,
  items?: SynchronizeAbleItem[]
  modifiedAt: ISOString
}

export type SynchronizeAbleDataSource = {
  name: string,
  items: SynchronizeAbleItem[]
}

export type DataSourcePlugin = {
  type: DataSourceType,
  getMetadata: (link: LinkDocType, credentials?: any) => Promise<{
    size?: string,
    contentType?: string,
    name: string,
    shouldDownload: boolean
  }>
  download: (link: LinkDocType, credentials?: any) => Promise<{
    stream: NodeJS.ReadableStream | Request,
    metadata: {
      size?: string,
      contentType?: string,
      name: string,
    }
  }>
  sync: (options: {
    userEmail: string,
    dataSourceId: string,
    credentials?: any,
    dataSourceType: DataSourceType
  }, helper: ReturnType<typeof createHelpers>) => Promise<SynchronizeAbleDataSource>,
}