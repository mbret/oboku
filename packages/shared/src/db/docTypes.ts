import type { CollectionMetadata } from "../metadata"
import type { FileLinkData } from "../plugins/file"
import type { SynologyDriveLinkData } from "../plugins/synologyDrive"
import type { UriLinkData } from "../plugins/uri"
import type { WebdavLinkData } from "../plugins/webdav"
import type { BookDocType } from "./books"
/** Union of all plugin-specific link payloads (stored on link.data and sync item.linkData). */
import type { CouchDBMeta } from "./couchdb"
import type { RxDbMeta } from "./rxdb"

export type LinkData =
  | WebdavLinkData
  | FileLinkData
  | SynologyDriveLinkData
  | UriLinkData

type CommonBase = CouchDBMeta & RxDbMeta

/**
 * Link data shape for a given provider. Same credentials shape used for link.data,
 * collection.linkData, sync items, and when calling plugin getFileMetadata/getFolderMetadata.
 * Providers without link data (e.g. dropbox, DRIVE) get undefined.
 */
export type LinkDataForProvider<T extends DataSourceDocType["type"]> =
  T extends "webdav"
    ? WebdavLinkData
    : T extends "synology-drive"
      ? SynologyDriveLinkData
      : T extends "URI"
        ? UriLinkData
        : T extends "file"
          ? FileLinkData
          : undefined

/**
 * Link document for a specific provider; `data` is correctly typed as that provider's
 * link credentials (LinkDataForProvider<T>). Use to type refresh book, refresh collection,
 * and sync flows when the provider is known.
 */
export type LinkDocTypeForProvider<T extends DataSourceDocType["type"]> =
  CommonBase & {
    type: T
    /**
     * Identifier of the resource within the plugin (e.g. file path, file id).
     * Uniqueness for sync, reattach and duplicate detection is (type + resourceId + data).
     */
    resourceId: string
    /**
     * Provider-specific link credentials (e.g. connectorId for WebDAV/Synology).
     * Same shape as collection.linkData and sync item linkData; required to connect with provider.
     */
    data: LinkDataForProvider<T> | null
    book: string | null
    rx_model: "link"
    contentLength?: number | null
    modifiedAt: string | null
    createdAt: string
  }

/** Link document; discriminated union so narrowing link.type narrows link.data per provider. */
export type LinkDocType =
  | LinkDocTypeForProvider<"webdav">
  | LinkDocTypeForProvider<"synology-drive">
  | LinkDocTypeForProvider<"file">
  | LinkDocTypeForProvider<"DRIVE">
  | LinkDocTypeForProvider<"dropbox">
  | LinkDocTypeForProvider<"URI">
  | LinkDocTypeForProvider<"server">

/**
 * Minimal link shape passed to plugin getFileMetadata/getFolderMetadata and used when
 * refreshing book or collection. Carries the same provider-specific credentials (data)
 * whether the source is a link, a collection, or a datasource.
 */
export type LinkWithCredentials<T extends DataSourceDocType["type"]> = Pick<
  LinkDocTypeForProvider<T>,
  "type" | "resourceId" | "data"
>

export type BaseDataSourceDocType = CommonBase & {
  lastSyncedAt: number | null
  syncStatus: null | "fetching"
  lastSyncErrorCode?: string | null
  rx_model: "datasource"
  modifiedAt: string | null
  createdAt: string
  isProtected?: boolean
  credentials?: Record<string, unknown> | null
  name?: string | null
  data_v2?: Record<string, unknown>
  /**
   * Selection of tags to apply to all books in this datasource
   * @important
   * The tag reference may be invalid eventually.
   */
  tags?: string[]
}

export type FileDataSourceDocType = BaseDataSourceDocType & {
  type: "file"
  data_v2?: undefined
}

export type URIDataSourceDocType = BaseDataSourceDocType & {
  type: "URI"
  data_v2?: UriLinkData
}

export type GoogleDriveDataSourceDocType = Omit<
  BaseDataSourceDocType,
  "data_v2"
> & {
  type: "DRIVE"
  data_v2?: {
    items?: ReadonlyArray<string>
  }
}

export type DropboxDataSourceDocType = Omit<
  BaseDataSourceDocType,
  "data_v2"
> & {
  type: "dropbox"
  data_v2?: {
    folderId?: string
    folderName?: string
  }
}

/** WebDAV datasource data: same link credentials (WebdavLinkData) plus optional directory. */
export type WebDAVDataSourceDocType = Omit<BaseDataSourceDocType, "data_v2"> & {
  type: "webdav"
  data_v2?: WebdavLinkData & { directory?: string }
}

/** Synology Drive datasource data: same link credentials (SynologyDriveLinkData) plus selected file/folder ids. */
export type SynologyDriveDataSourceDocType = Omit<
  BaseDataSourceDocType,
  "data_v2"
> & {
  type: "synology-drive"
  data_v2?: SynologyDriveLinkData & { items?: ReadonlyArray<string> }
}

export type ServerDataSourceDocType = BaseDataSourceDocType & {
  type: "server"
  data_v2?: undefined
}

export type DataSourceDocType =
  | GoogleDriveDataSourceDocType
  | DropboxDataSourceDocType
  | WebDAVDataSourceDocType
  | SynologyDriveDataSourceDocType
  | FileDataSourceDocType
  | URIDataSourceDocType
  | ServerDataSourceDocType

/** Data source / provider type (e.g. "webdav", "file", "dropbox"). */
export type DataSourceType = DataSourceDocType["type"]

/**
 * Datasource data_v2 shape for a given provider. Same credentials concept as
 * LinkDataForProvider where applicable (e.g. webdav data_v2 extends WebdavLinkData).
 */
export type DataSourceDataForProvider<T extends DataSourceType> = Extract<
  DataSourceDocType,
  { type: T }
>["data_v2"]

export type InsertAbleBookDocType = Omit<BookDocType, "_id" | "_rev">

/**
 * @deprecated
 */
export type DeprecatedBookDocType = {
  creator: string | null
  date: number | null
  lang: string | null
  publisher: string | null
  rights: string | null
  subject: string[] | null
  title: string | null
}

export type TagsDocType = CommonBase & {
  name: null | string
  isProtected: boolean
  isBlurEnabled?: boolean
  books: string[]
  rx_model: "tag"
  modifiedAt: string | null
  createdAt: string
}

export type SecretDocType = CommonBase & {
  name: string
  rx_model: "secret"
  modifiedAt: string | null
  createdAt: string
  value?: {
    iv: string
    data: string
  } | null
}

export type CollectionDocType<T extends DataSourceType = DataSourceType> =
  CommonBase & {
    books: string[]
    linkType?: T
    linkResourceId?: string
    linkData?: LinkDataForProvider<T>
    rx_model: "obokucollection"
    modifiedAt: string | null
    /**
     * Is used to avoid updating an item if the sync item
     * is not changed
     */
    syncAt?: string | null
    createdAt: string
    lastMetadataUpdatedAt?: string
    lastMetadataStartedAt?: string
    metadataUpdateStatus?: "fetching" | "idle"
    lastMetadataUpdateError?: null | string
    type?: "series" | "shelve"
    metadata?: CollectionMetadata[]
  }

export type WebdavConnectorDocType = {
  id: string
  url: string
  username: string
  passwordAsSecretId: string
  allowSelfSigned?: boolean
  type: "webdav"
}

export type SynologyDriveConnectorDocType = {
  id: string
  type: "synology-drive"
  url: string
  username: string
  passwordAsSecretId: string
  allowSelfSigned?: boolean
}

export type ServerConnectorDocType = {
  id: string
  type: "server"
  username: string
  passwordAsSecretId: string
  url?: string
  allowSelfSigned?: boolean
}

export type SettingsConnectorDocType =
  | WebdavConnectorDocType
  | SynologyDriveConnectorDocType
  | ServerConnectorDocType

export type SettingsConnectorType = SettingsConnectorDocType["type"]

export type SettingsConnectorInput<
  T extends SettingsConnectorType = SettingsConnectorType,
> = Omit<Extract<SettingsConnectorDocType, { type: T }>, "id" | "type">

export type SettingsConnectorUpdate<
  T extends SettingsConnectorType = SettingsConnectorType,
> = Omit<Extract<SettingsConnectorDocType, { type: T }>, "type">

export type SettingsResolvedConnectorData<
  T extends SettingsConnectorType = SettingsConnectorType,
> = Omit<
  Extract<SettingsConnectorDocType, { type: T }>,
  "passwordAsSecretId"
> & {
  password: string
}

export type SettingsDocType = {
  _id: "settings"
  masterEncryptionKey?: {
    salt: string
    iv: string
    data: string
  } | null
  connectors?: SettingsConnectorDocType[]
  /**
   * @deprecated
   * Use connectors instead.
   */
  webdavConnectors?: unknown[]
  readerGlobalFontScale?: number | null
  readerMobileFontScale?: number | null
  readerTabletFontScale?: number | null
  readerDesktopFontScale?: number | null
}

export function isTag(
  document: TagsDocType | unknown,
): document is TagsDocType {
  return (document as TagsDocType).rx_model === "tag"
}

export function isBook(
  document: BookDocType | unknown,
): document is BookDocType {
  return (document as BookDocType).rx_model === "book"
}

export function isLink(
  document: LinkDocType | unknown,
): document is LinkDocType {
  return (document as LinkDocType).rx_model === "link"
}

export function isDataSource(
  document: DataSourceDocType | unknown,
): document is DataSourceDocType {
  return (document as DataSourceDocType).rx_model === "datasource"
}

export function isCollection(
  document: CollectionDocType | unknown,
): document is CollectionDocType {
  return (document as CollectionDocType).rx_model === "obokucollection"
}

/**
 * Type guard: narrows collection to CollectionDocType<T> when linkType matches.
 * Use to read provider-specific linkData (e.g. connectorId) with correct typing.
 */
export function isCollectionOfType<T extends DataSourceType>(
  c: { linkType?: string },
  linkType: T,
): c is CollectionDocType<T> {
  return c.linkType === linkType
}

type MangoSelectorOperator<T> = {
  $nin?: any[]
  $in?: any[]
  $ne?: T
  $elemMatch?: {
    $eq: T extends Array<any> ? T[number] : T
  }
}

/** Selector value for a primitive or array field: equality or operator ($in, $ne, etc.). */
type PrimitiveOrArraySelectorValue<T> = T | MangoSelectorOperator<T>

/**
 * Recursive selector type using nested JSON objects (CouchDB Mango supports both
 * nested objects and dot notation; nested is type-safe and mirrors the document shape).
 * - For object fields: value is a nested selector (same shape as the subdocument).
 * - For primitives/arrays: value is the field type or MangoSelectorOperator<...>.
 */
type SafeMangoSelector<RxDocType> = {
  [K in keyof RxDocType]?: NonNullable<RxDocType[K]> extends infer V
    ? V extends readonly unknown[]
      ? PrimitiveOrArraySelectorValue<RxDocType[K]>
      : V extends object
        ? SafeMangoSelector<V>
        : PrimitiveOrArraySelectorValue<RxDocType[K]>
    : never
}

interface MangoQuery<RxDocType> {
  // JSON object describing criteria used to select documents (use nested objects for subfields, e.g. data: { connectorId: { $in: [...] } }).
  selector?:
    | SafeMangoSelector<RxDocType>
    | {
        $or: SafeMangoSelector<RxDocType>[]
      }

  // Maximum number of results returned. Default is 25.
  limit?: number

  // http://docs.couchdb.org/en/latest/api/database/find.html#filtering-fields
  fields?: (keyof RxDocType)[]
}

export type MangoQuerySelector<T> = T

export type SafeMangoQuery<RxDocType = any> = MangoQuery<RxDocType>

export type DocType =
  | BookDocType
  | TagsDocType
  | DataSourceDocType
  | LinkDocType
  | CollectionDocType

export type ModelOf<Type extends DocType["rx_model"]> = DocType extends infer DT
  ? DT extends DocType
    ? DT["rx_model"] extends Type
      ? DT
      : never
    : never
  : never
