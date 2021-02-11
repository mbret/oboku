import { Request } from 'request'
import { DataSourceType, LinkDocType } from "@oboku/shared";
import { createHelpers } from './helpers';

type NameWithMetadata = string
type ISOString = string

type SynchronizableItem = {
  type: 'file' | 'folder',
  resourceId: string,
  name: NameWithMetadata,
  items?: SynchronizableItem[]
  modifiedAt: ISOString
}

export type SynchronizableDataSource = {
  name: string,
  items: SynchronizableItem[]
}

export type DataSource = {
  download: (link: LinkDocType, credentials?: any) => Promise<{
    stream: NodeJS.ReadableStream | Request,
    metadata: {
      size?: string,
      contentType?: string,
      name?: string,
    }
  }>
  sync: (options: {
    userEmail: string,
    dataSourceId: string,
    credentials?: any,
    dataSourceType: DataSourceType
  }, helper: ReturnType<typeof createHelpers>) => Promise<SynchronizableDataSource>,
}