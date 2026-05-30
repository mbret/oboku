import {
  type CollectionDocType,
  type LinkMetadata,
  DataSourceDocType,
  type DataSourceType,
  type DocType,
  type LinkDocType,
  type LinkDocTypeForProvider,
  type LinkWithCredentials,
  type ModelOf,
  type ProviderApiCredentials,
  type SafeMangoQuery,
  type SynchronizeAbleDataSource,
  type SynchronizeAbleItem,
} from "@oboku/shared"
import type createNano from "nano"
import type { IncomingMessage } from "node:http"
import { SyncReport } from "src/lib/sync/SyncReport"

/** Re-export from shared so sync item/data source types are single source of truth. */
export type {
  SynchronizeAbleItem,
  SynchronizeAbleDataSource,
} from "@oboku/shared"

export type Helpers = {
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
    ({
      _id: string
      _rev: string
    } & D)[]
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

/** Sync context; generic so `providerCredentials` is the typed API credentials for the provider. */
export type SyncContext<T extends DataSourceType = DataSourceType> = {
  userName: string
  dataSourceId: string
  /** Resolved at runtime (e.g. from secrets). Typed per provider (WebdavApiCredentials, DriveApiCredentials, etc.). */
  providerCredentials: ProviderApiCredentials<T>
  dataSourceType: T
  dataSource: DataSourceDocType
  syncReport: SyncReport
  db: createNano.DocumentScope<unknown>
}

/** Link candidate returned by getLinkCandidatesForItem; includes whether current sync credentials apply. */
export type LinkCandidate = LinkDocType & {
  isUsingSameProviderCredentials: boolean
}

/**
 * Find all links that match this sync item (same resource). Caller will
 * clean/merge (keep one with valid book, delete dangling duplicates) then
 * use the single link to resolve the book. Each link includes
 * isUsingSameProviderCredentials so the sync can decide whether to refresh metadata.
 */
export type GetLinkCandidatesForItem<
  TProvider extends DataSourceType = DataSourceType,
> = (
  item: SynchronizeAbleItem<TProvider>,
  ctx: SyncContext<TProvider>,
) => Promise<{ links: LinkCandidate[] }>

/** Collection candidate with same-credentials flag for sync and metadata refresh. */
export type CollectionCandidate = CollectionDocType & {
  _id: string
  _rev: string
  isUsingSameProviderCredentials: boolean
}

/**
 * Find all collections that match this sync item (same resource / link data).
 * Each includes isUsingSameProviderCredentials so the caller can pick the one
 * that matches the current datasource (e.g. for metadata refresh).
 */
export type GetCollectionCandidatesForItem<
  TProvider extends DataSourceType = DataSourceType,
> = (
  item: SynchronizeAbleItem<TProvider>,
  ctx: SyncContext<TProvider>,
) => Promise<{ collections: CollectionCandidate[] }>

/**
 * Params shape for the facade's public API only. Callers pass this to
 * pluginFacade.getFolderMetadata / getFileMetadata. The facade narrows by
 * link.type and calls the plugin with strongly-typed per-provider params.
 * Plugins never see this type; they receive only their provider's types.
 */
export type PluginFacadeParams = {
  link: Pick<LinkDocType, "type" | "data">
  providerCredentials?: ProviderApiCredentials<DataSourceType>
  db?: createNano.DocumentScope<unknown>
}

/** Per-provider params for getFolderMetadata / getFileMetadata. */
export type PluginMetadataParams<T extends DataSourceType = DataSourceType> = {
  link: LinkWithCredentials<T>
  providerCredentials: ProviderApiCredentials<T>
  db?: createNano.DocumentScope<unknown>
}

/**
 * Sentinel a plugin MUST return from `getFileMetadata` when the
 * provider has no usable "last modified" for this resource. Using a
 * `unique symbol` (instead of `string | undefined` or a string literal)
 * keeps the union from collapsing to `string`, so the consumer is
 * forced to narrow via `=== MODIFIED_AT_UNSUPPORTED` before the value
 * can flow into the persisted {@link LinkMetadata.modifiedAt} slot.
 */
export const MODIFIED_AT_UNSUPPORTED: unique symbol = Symbol(
  "oboku.modifiedAt.unsupported",
)

export type ProviderModifiedAt = string | typeof MODIFIED_AT_UNSUPPORTED

/**
 * Data source plugin, generic in the provider type. Each method receives
 * strongly-typed params for that provider (e.g. DRIVE plugin gets
 * LinkWithCredentials<"DRIVE"> and DriveApiCredentials).
 */
export type DataSourcePlugin<
  TProvider extends DataSourceType = DataSourceType,
> = {
  type: string
  getFolderMetadata: (
    data: PluginMetadataParams<TProvider>,
  ) => Promise<{ name?: string; modifiedAt?: string }>
  getFileMetadata: (data: PluginMetadataParams<TProvider>) => Promise<{
    name?: string
    /** Provider timestamp (ISO 8601 preferred) or {@link MODIFIED_AT_UNSUPPORTED}. */
    modifiedAt: ProviderModifiedAt
    canDownload?: boolean
    contentType?: string
    /**
     * Restricted to {@link LinkMetadata}'s advertised fields on purpose:
     * provider-specific identifiers like `isbn` / `googleVolumeId` are
     * NOT accepted here — they belong in the filename as oboku
     * directives (e.g. `[oboku~isbn~…]`), so the storage provider
     * stays the single source of truth and we never persist a stale
     * duplicate.
     */
    bookMetadata?: Partial<Omit<LinkMetadata, "type">>
  }>
  download: (
    link: LinkDocTypeForProvider<TProvider>,
    providerCredentials: ProviderApiCredentials<TProvider>,
    db?: createNano.DocumentScope<unknown>,
  ) => Promise<{
    stream: NodeJS.ReadableStream | IncomingMessage
  }>
  /** Find all links that match this item (same resource). Caller cleans/merges and uses one. */
  getLinkCandidatesForItem: GetLinkCandidatesForItem<TProvider>
  /** Find all collections that match this item (same resource / link data). Caller picks one or creates. */
  getCollectionCandidatesForItem: GetCollectionCandidatesForItem<TProvider>
  sync: (
    options: SyncContext<TProvider>,
    helper: Helpers,
  ) => Promise<SynchronizeAbleDataSource<TProvider>>
}
