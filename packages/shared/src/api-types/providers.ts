import type { DataSourceType } from "../db/docTypes"
import type { ProviderApiCredentials } from "../plugins/credentials"

type ProviderRequest = {
  providerCredentials: ProviderApiCredentials<DataSourceType>
}

export type RefreshBookMetadataRequest = ProviderRequest & {
  bookId: string
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
