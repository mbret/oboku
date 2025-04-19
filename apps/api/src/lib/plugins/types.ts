import {
  type LinkDocType,
  dataSourceHelpers,
  type SafeMangoQuery,
  type DocType,
  type ModelOf,
  type BookMetadata,
  DataSourceDocType,
} from "@oboku/shared"
import type createNano from "nano"
import type { Metadata } from "src/lib/metadata/types"
import type { IncomingMessage } from "node:http"
import { SyncReport } from "../sync/SyncReport"

export { dataSourceHelpers }

type NameWithMetadata = string
type ISOString = string

export type SynchronizeAbleItem = {
  type: `file` | `folder`
  /**
   * @important
   * Unique identifier for this item which would not clash with other items that would
   * not point to the same resource.
   *
   * @example
   * dropbox:1234567890
   * webdav:{base64-url}/media/Books/my-book.epub
   */
  resourceId: string
  /**
   * @important
   * Can be used to store additional data to the link so that it can be used
   * later. For example webdav data source can attach their same connectorId so
   * that by default the item will be using the same connector in its link
   */
  linkData?: Record<string, unknown>
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
  getFolderMetadata: (data: {
    data?: Record<string, unknown>
    link: Pick<LinkDocType, "type" | "resourceId" | "data">
  }) => Promise<{
    name?: string
    modifiedAt?: string
  }>
  getFileMetadata: (data: {
    data?: Record<string, unknown>
    link: Pick<LinkDocType, "type" | "resourceId" | "data">
  }) => Promise<{
    name?: string
    modifiedAt?: string
    canDownload?: boolean
    contentType?: string
    bookMetadata?: Partial<Omit<BookMetadata, "type">>
  }>
  download?: (
    link: LinkDocType,
    data?: Record<string, unknown>,
  ) => Promise<{
    stream: NodeJS.ReadableStream | IncomingMessage
    metadata: Omit<Metadata, "type"> & { contentType?: string }
  }>
  sync?: (
    options: {
      userName: string
      dataSourceId: string
      data: Record<string, unknown> | undefined
      dataSourceType: DataSourceDocType["type"]
      syncReport: SyncReport
      db: createNano.DocumentScope<unknown>
    },
    helper: Helpers,
  ) => Promise<SynchronizeAbleDataSource>
}
