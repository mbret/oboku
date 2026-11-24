import {
  type CollectionDocType,
  type LinkMetadata,
  type DataSourceDocTypeFor,
  type SourceType,
  type LinkDocType,
  type LinkDocTypeForSource,
  type LinkWithCredentials,
  type SourceApiCredentials,
  type SynchronizeAbleDataSource,
  type SynchronizeAbleItem,
} from "@oboku/shared"
import type createNano from "nano"
import type { IncomingMessage } from "node:http"
import { SyncReport } from "../datasource/sync/SyncReport.js"

/** Re-export from shared so sync item/data source types are single source of truth. */
export type {
  SynchronizeAbleItem,
  SynchronizeAbleDataSource,
} from "@oboku/shared"

/** Sync context; generic so `providerCredentials` is the typed API credentials for the source. */
export type SyncContext<T extends SourceType = SourceType> = {
  userName: string
  dataSourceId: string
  /** Resolved at runtime (e.g. from secrets). Typed per source (WebdavApiCredentials, DriveApiCredentials, etc.). */
  providerCredentials: SourceApiCredentials<T>
  dataSourceType: T
  dataSource: DataSourceDocTypeFor<T>
  syncReport: SyncReport
  db: createNano.DocumentScope<unknown>
}

/** Link candidate returned by getLinkCandidatesForItem; includes whether current sync credentials apply. */
export type LinkCandidate = LinkDocType & {
  isUsingSameSourceCredentials: boolean
}

/**
 * Find all links that match this sync item (same resource). Caller will
 * clean/merge (keep one with valid book, delete dangling duplicates) then
 * use the single link to resolve the book. Each link includes
 * isUsingSameSourceCredentials so the sync can decide whether to refresh metadata.
 */
export type GetLinkCandidatesForItem<
  TSourceType extends SourceType = SourceType,
> = (
  item: SynchronizeAbleItem<TSourceType>,
  ctx: SyncContext<TSourceType>,
) => Promise<{ links: LinkCandidate[] }>

/** Collection candidate with same-credentials flag for sync and metadata refresh. */
export type CollectionCandidate = CollectionDocType & {
  _id: string
  _rev: string
  isUsingSameSourceCredentials: boolean
}

/**
 * Find all collections that match this sync item (same resource / link data).
 * Each includes isUsingSameSourceCredentials so the caller can pick the one
 * that matches the current datasource (e.g. for metadata refresh).
 */
export type GetCollectionCandidatesForItem<
  TSourceType extends SourceType = SourceType,
> = (
  item: SynchronizeAbleItem<TSourceType>,
  ctx: SyncContext<TSourceType>,
) => Promise<{ collections: CollectionCandidate[] }>

/** Per-source params for getFolderMetadata / getFileMetadata. */
export type PluginMetadataParams<T extends SourceType = SourceType> = {
  link: LinkWithCredentials<T>
  providerCredentials: SourceApiCredentials<T>
  db?: createNano.DocumentScope<unknown>
}

/**
 * Sentinel a plugin MUST return from `getFileMetadata` when the
 * source has no usable "last modified" for this resource. Using a
 * `unique symbol` (instead of `string | undefined` or a string literal)
 * keeps the union from collapsing to `string`, so the consumer is
 * forced to narrow via `=== MODIFIED_AT_UNSUPPORTED` before the value
 * can flow into the persisted {@link LinkMetadata.modifiedAt} slot.
 */
export const MODIFIED_AT_UNSUPPORTED: unique symbol = Symbol(
  "oboku.modifiedAt.unsupported",
)

export type SourceModifiedAt = string | typeof MODIFIED_AT_UNSUPPORTED

/**
 * Data source plugin, generic in the source type. Each method receives
 * strongly-typed params for that source (e.g. DRIVE plugin gets
 * LinkWithCredentials<"DRIVE"> and DriveApiCredentials).
 */
export type SourcePlugin<TSourceType extends SourceType = SourceType> = {
  type: string
  getFolderMetadata: (
    data: PluginMetadataParams<TSourceType>,
  ) => Promise<{ name?: string; modifiedAt?: string }>
  getFileMetadata: (data: PluginMetadataParams<TSourceType>) => Promise<{
    name?: string
    /** Source timestamp (ISO 8601 preferred) or {@link MODIFIED_AT_UNSUPPORTED}. */
    modifiedAt: SourceModifiedAt
    canDownload?: boolean
    contentType?: string
    /**
     * Restricted to {@link LinkMetadata}'s advertised fields on purpose:
     * source-specific identifiers like `isbn` / `googleVolumeId` are
     * NOT accepted here — they belong in the filename as oboku
     * directives (e.g. `[oboku~isbn~…]`), so the source
     * stays the single source of truth and we never persist a stale
     * duplicate.
     */
    bookMetadata?: Partial<Omit<LinkMetadata, "type">>
  }>
  download: (
    link: LinkDocTypeForSource<TSourceType>,
    providerCredentials: SourceApiCredentials<TSourceType>,
    db?: createNano.DocumentScope<unknown>,
  ) => Promise<{
    stream: NodeJS.ReadableStream | IncomingMessage
    /** The number of bytes `stream` yields, when the source's answer states it. */
    size?: number
  }>
  /** Find all links that match this item (same resource). Caller cleans/merges and uses one. */
  getLinkCandidatesForItem: GetLinkCandidatesForItem<TSourceType>
  /** Find all collections that match this item (same resource / link data). Caller picks one or creates. */
  getCollectionCandidatesForItem: GetCollectionCandidatesForItem<TSourceType>
  sync: (
    options: SyncContext<TSourceType>,
  ) => Promise<SynchronizeAbleDataSource<TSourceType>>
}
