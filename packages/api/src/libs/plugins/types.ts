import { Request } from "request"
import {
  directives,
  LinkDocType,
  dataSourceHelpers,
  InsertAbleBookDocType,
  SafeMangoQuery,
  DocType,
  ModelOf
} from "@oboku/shared"
import cheerio from "cheerio"
import fetch from "node-fetch"
import createNano, { DocumentInsertResponse } from "nano"
import { Metadata } from "@libs/metadata/types"

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
  isBookCoverExist: (bookId: string) => Promise<boolean>
  createBook: (
    data?: Partial<InsertAbleBookDocType>
  ) => Promise<createNano.DocumentInsertResponse>
  findOne: <M extends DocType["rx_model"], D extends ModelOf<M>>(
    model: M,
    query: SafeMangoQuery<D>
  ) => Promise<
    | ({
        _id: string
        _rev: string
      } & D)
    | null
  >
  find: <M extends DocType["rx_model"], D extends ModelOf<M>>(
    model: M,
    query: SafeMangoQuery<D>
  ) => Promise<
    {
      _id: string
      _rev: string
    }[]
  >
  atomicUpdate: <M extends DocType["rx_model"], K extends ModelOf<M>>(
    model: M,
    id: string,
    cb: (oldData: createNano.DocumentGetResponse & K) => Partial<K>
  ) => Promise<unknown>
  create: <M extends DocType["rx_model"], D extends ModelOf<M>>(
    model: M,
    data: Omit<D, "rx_model" | "_id" | "_rev">
  ) => Promise<createNano.DocumentInsertResponse>
  addTagsToBook: (bookId: string, tagIds: string[]) => void
  getOrCreateTagFromName: (name: string) => void
  addLinkToBook: (
    bookId: string,
    linkId: string
  ) => Promise<[DocumentInsertResponse, DocumentInsertResponse]>
  createError: (
    code: "unknown" | "unauthorized" | "rateLimitExceeded",
    previousError?: Error
  ) => void
  extractDirectivesFromName: typeof directives.extractDirectivesFromName
  createTagFromName: (
    name: string,
    silent: boolean
  ) => Promise<{
    id: string
    created: boolean
  }>
}

export type DataSourcePlugin = {
  type: string
  getMetadata: (
    link: LinkDocType,
    credentials?: any
  ) => Promise<
    Omit<Metadata, "type"> & { shouldDownload: boolean; contentType?: string }
  >
  download?: (
    link: LinkDocType,
    credentials?: any
  ) => Promise<{
    stream: NodeJS.ReadableStream | Request
    metadata: Omit<Metadata, "type"> & { contentType?: string }
  }>
  sync?: (
    options: {
      userName: string
      dataSourceId: string
      credentials?: any
      dataSourceType: string
    },
    helper: Helpers
  ) => Promise<SynchronizeAbleDataSource>
}
