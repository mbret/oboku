import {
  type LinkDocType,
  dataSourceHelpers,
  type SafeMangoQuery,
  type DocType,
  type ModelOf,
  type BookMetadata,
} from "@oboku/shared"
import cheerio from "cheerio"
import fetch from "node-fetch"
import type createNano from "nano"
import type { Metadata } from "@libs/metadata/types"
import type { SyncReport } from "@libs/sync/SyncReport"
import type { IncomingMessage } from "http"

export { dataSourceHelpers, cheerio, fetch }

type NameWithMetadata = string
type ISOString = string

type SynchronizeAbleItem = {
  type: `file` | `folder`
  resourceId: string
  name: NameWithMetadata
  items?: SynchronizeAbleItem[]
  modifiedAt: ISOString
}

export type SynchronizeAbleDataSource = {
  name: string
  items: SynchronizeAbleItem[]
}

type Helpers = {
  refreshBookMetadata: (opts: { bookId: string }) => Promise<any>
  getDataSourceData: <Data>() => Promise<Partial<Data>>
  findOne: <M extends DocType["rx_model"], D extends ModelOf<M>>(
    model: M,
    query: SafeMangoQuery<D>,
  ) => Promise<
    | ({
        _id: string
        _rev: string
      } & D)
    | null
  >
  find: <M extends DocType["rx_model"], D extends ModelOf<M>>(
    model: M,
    query: SafeMangoQuery<D>,
  ) => Promise<
    {
      _id: string
      _rev: string
    }[]
  >
  atomicUpdate: <M extends DocType["rx_model"], K extends ModelOf<M>>(
    model: M,
    id: string,
    cb: (oldData: createNano.DocumentGetResponse & K) => Partial<K>,
  ) => Promise<unknown>
  create: <M extends DocType["rx_model"], D extends ModelOf<M>>(
    model: M,
    data: Omit<D, "rx_model" | "_id" | "_rev">,
  ) => Promise<createNano.DocumentInsertResponse>
  getOrCreateTagFromName: (name: string) => void
}

export type DataSourcePlugin = {
  type: string
  getMetadata: (data: { credentials?: any; id: string; data?: any }) => Promise<
    | {
        name?: string
        modifiedAt?: string
        canDownload?: boolean
        contentType?: string
        bookMetadata?: Partial<Omit<BookMetadata, "type">>
      }
    | undefined
  >
  download?: (
    link: LinkDocType,
    credentials?: any,
  ) => Promise<{
    stream: NodeJS.ReadableStream | IncomingMessage
    metadata: Omit<Metadata, "type"> & { contentType?: string }
  }>
  sync?: (
    options: {
      userName: string
      dataSourceId: string
      credentials?: any
      dataSourceType: string
      syncReport: SyncReport
    },
    helper: Helpers,
  ) => Promise<SynchronizeAbleDataSource>
}
