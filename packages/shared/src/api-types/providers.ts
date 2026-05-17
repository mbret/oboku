import type { DataSourceType } from "../db/docTypes"
import type { ProviderApiCredentials } from "../plugins/credentials"

type ProviderRequest = {
  providerCredentials: ProviderApiCredentials<DataSourceType>
}

export type RefreshBookMetadataRequest = ProviderRequest & {
  bookId: string
  /**
   * Hard refresh: bypass every reuse cache (file metadata,
   * cover blob) so the file is re-downloaded (when allowed)
   * and the cover regenerated even if nothing changed.
   */
  force?: boolean
}

export type RefreshBookMetadataResponse = Record<string, never>

export type RefreshCollectionMetadataRequest = ProviderRequest & {
  collectionId: string
  soft?: boolean
}

export type RefreshCollectionMetadataResponse = Record<string, never>

export type SyncDataSourceRequest = ProviderRequest & {
  dataSourceId: string
}

export type SyncDataSourceResponse = Record<string, never>
