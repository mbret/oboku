import type { CollectionMetadata } from "../metadata"
import type {
  DropboxLibrarySyncDocType,
  DropboxLinkData,
} from "../plugins/dropbox"
import type { FileLibrarySyncDocType, FileLinkData } from "../plugins/file"
import type {
  GoogleDriveLibrarySyncDocType,
  GoogleDriveLinkData,
} from "../plugins/google"
import type {
  OneDriveLibrarySyncDocType,
  OneDriveLinkData,
} from "../plugins/oneDrive"
import type {
  OpdsConnectorDocType,
  OpdsLibrarySyncDocType,
  OpdsLinkData,
} from "../plugins/opds"
import type {
  ServerConnectorDocType,
  ServerLibrarySyncDocType,
  ServerLinkData,
} from "../plugins/server"
import type {
  SynologyDriveConnectorDocType,
  SynologyDriveLibrarySyncDocType,
  SynologyDriveLinkData,
} from "../plugins/synologyDrive"
import type { URILibrarySyncDocType, UriLinkData } from "../plugins/uri"
import type {
  WebDAVLibrarySyncDocType,
  WebdavConnectorDocType,
  WebdavLinkData,
} from "../plugins/webdav"
import type { BookDocType } from "./books"
import type { CouchDBMeta } from "./couchdb"
import type { RxDbMeta } from "./rxdb"

export type LinkData =
  | GoogleDriveLinkData
  | OneDriveLinkData
  | DropboxLinkData
  | WebdavLinkData
  | FileLinkData
  | SynologyDriveLinkData
  | ServerLinkData
  | UriLinkData
  | OpdsLinkData

type CommonBase = CouchDBMeta & RxDbMeta

/**
 * Plugin-specific link data shape for a given source. Contains both identity
 * fields (e.g. fileId, filePath) and access/metadata fields (e.g. connectorId, etag).
 * Used for link.data, collection.linkData, sync items, and plugin API calls.
 */
export type LinkDataForSource<T extends LibrarySyncDocType["type"]> =
  T extends "DRIVE"
    ? GoogleDriveLinkData
    : T extends "one-drive"
      ? OneDriveLinkData
      : T extends "dropbox"
        ? DropboxLinkData
        : T extends "webdav"
          ? WebdavLinkData
          : T extends "synology-drive"
            ? SynologyDriveLinkData
            : T extends "server"
              ? ServerLinkData
              : T extends "URI"
                ? UriLinkData
                : T extends "file"
                  ? FileLinkData
                  : T extends "opds"
                    ? OpdsLinkData
                    : never

/**
 * Link document for a specific source; `data` is correctly typed as that source's
 * link data (LinkDataForSource<T>).
 */
export type LinkDocTypeForSource<T extends LibrarySyncDocType["type"]> =
  CommonBase & {
    type: T
    data: LinkDataForSource<T>
    book: string | null
    rx_model: "link"
    modifiedAt: string | null
    createdAt: string
  }

/** Link document; discriminated union so narrowing link.type narrows link.data per source. */
export type LinkDocType =
  | LinkDocTypeForSource<"webdav">
  | LinkDocTypeForSource<"synology-drive">
  | LinkDocTypeForSource<"file">
  | LinkDocTypeForSource<"DRIVE">
  | LinkDocTypeForSource<"one-drive">
  | LinkDocTypeForSource<"dropbox">
  | LinkDocTypeForSource<"URI">
  | LinkDocTypeForSource<"server">
  | LinkDocTypeForSource<"opds">

/**
 * Minimal link shape passed to plugin getFileMetadata/getFolderMetadata and used when
 * refreshing book or collection. Carries the same source-specific credentials (data)
 * whether the source is a link, a collection, or a datasource.
 */
export type LinkWithCredentials<T extends LibrarySyncDocType["type"]> = Pick<
  LinkDocTypeForSource<T>,
  "type" | "data"
>

export type BaseLibrarySyncDocType = CommonBase & {
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
   * Selection of tags to apply to all books in this library sync
   * @important
   * The tag reference may be invalid eventually.
   */
  tags?: string[]
  /**
   * Default `metadataFileDownloadEnabled` policy applied to NEW books detected
   * during sync. Mirrors the per-book override but only takes effect when set
   * to `false` (i.e. user explicitly opted out at the library sync level): in
   * that case any newly-detected book will be created with
   * `metadataFileDownloadEnabled = false`. When `undefined` / `null` / `true`
   * the library sync uses the default behaviour (file download allowed) and
   * never overrides the per-book value. Existing books are never modified.
   */
  metadataFileDownloadEnabled?: boolean | null
}

export type LibrarySyncDocType =
  | GoogleDriveLibrarySyncDocType
  | OneDriveLibrarySyncDocType
  | DropboxLibrarySyncDocType
  | WebDAVLibrarySyncDocType
  | SynologyDriveLibrarySyncDocType
  | FileLibrarySyncDocType
  | URILibrarySyncDocType
  | ServerLibrarySyncDocType
  | OpdsLibrarySyncDocType

/** Library sync / source type (e.g. "webdav", "file", "dropbox"). */
export type SourceType = LibrarySyncDocType["type"]

export type LibrarySyncDocTypeFor<T extends SourceType> = Extract<
  LibrarySyncDocType,
  { type: T }
>

/**
 * Library sync data_v2 shape for a given source. Same credentials concept as
 * LinkDataForSource where applicable (e.g. webdav data_v2 extends WebdavLinkData).
 */
export type LibrarySyncDataForSource<T extends SourceType> = Extract<
  LibrarySyncDocType,
  { type: T }
>["data_v2"]

export type InsertAbleBookDocType = Omit<BookDocType, "_id" | "_rev">

/**
 * @deprecated Book properties the app no longer writes, still declared in the
 * legacy group of the RxDB book schema, which says what each is waiting on.
 */
export type DeprecatedBookDocType = {
  creator: string | null
  date: number | null
  lang: string | null
  publisher: string | null
  rights: string | null
  subject: string[] | null
  title: string | null
  /**
   * Superseded by `readingStateUpdatedAt` and no longer written, but still on
   * legacy books and written by older versions of the app. Only
   * `getReadingStateUpdatedTime` reads it.
   */
  readingStateCurrentBookmarkProgressUpdatedAt?: string | null
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

/**
 * A page bookmark, a highlight or a note that the user made in a book.
 * prose-reader calls all three "annotations". Its `_id` is the id that
 * prose-reader gives the annotation, a UUID: oboku does not generate another
 * one. The reading position of a book is not an annotation: it is on the book,
 * in its `readingStateCurrentBookmark*` fields.
 */
export type AnnotationDocType = CommonBase & {
  rx_model: "annotation"
  /** The `_id` of the book the user made the annotation in. */
  bookId: string
  /**
   * Where the annotation is in the book, as prose-reader generated it: a range
   * for a highlight, one place for a page bookmark. The reader locates the
   * annotation with it and with nothing else.
   */
  cfi: string
  /**
   * The color of a highlight, as react-reader gives it: a CSS color such as
   * `rgba(216, 191, 216, 1)`. `null` on a page bookmark.
   */
  highlightColor?: string | null
  /**
   * The note of the user. react-reader gives `""` for a highlight without a
   * note. `null` on a page bookmark.
   */
  notes?: string | null
  /**
   * The text the highlight covered when the user created the annotation, as
   * prose-reader reports it. A list, an export or a search can show it without
   * the book's file. It never locates the annotation. If the passage at the
   * `cfi` differs from it, the book's file changed after the user made the
   * annotation. `""` for a highlight of an image, `null` on a page bookmark.
   */
  highlightedText?: string | null
  /** When the annotation was created, as an ISO date. */
  createdAt: string
  /** When the annotation last changed, as an ISO date. `null` until the first change. */
  modifiedAt: string | null
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

export type CollectionDocType<T extends SourceType = SourceType> =
  CommonBase & {
    books: string[]
    linkType?: T
    linkData?: LinkDataForSource<T>
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
    /**
     * Tri-state user override for external metadata fetching on this collection:
     * - `undefined` / `null`: follow protection (skip when any contained book is
     *   protected, fetch otherwise)
     * - `true`: always fetch external metadata, even if protected
     * - `false`: never fetch external metadata
     *
     * Use {@link resolveMetadataFetchEnabled} to collapse this to a boolean.
     * Only gates calls to third-party providers; user library syncs keep syncing.
     */
    metadataFetchEnabled?: boolean | null
  }

export type SettingsConnectorDocType =
  | WebdavConnectorDocType
  | SynologyDriveConnectorDocType
  | ServerConnectorDocType
  | OpdsConnectorDocType

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

/**
 * A catalog's settings for the account, under its metadata-fetcher provider
 * id. A catalog with no entry keeps its defaults, so it is enabled.
 */
export type SettingsCatalogDocType = {
  id: string
  isEnabled: boolean
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
  catalogs?: SettingsCatalogDocType[]
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

  // http://docs.couchdb.org/en/latest/api/database/find.html#filtering-fields
  fields?: (keyof RxDocType)[]
}

export type MangoQuerySelector<T> = T

export type SafeMangoQuery<RxDocType = any> = MangoQuery<RxDocType>

export type DocType =
  | BookDocType
  | TagsDocType
  | LibrarySyncDocType
  | LinkDocType
  | CollectionDocType

export type ModelOf<Type extends DocType["rx_model"]> = DocType extends infer DT
  ? DT extends DocType
    ? DT["rx_model"] extends Type
      ? DT
      : never
    : never
  : never
