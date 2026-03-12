type RxModel = "link" | "datasource" | "obokucollection" | "tag" | "book"

export type ReportEntry = {
  rx_model: RxModel
  id: string
  label?: string
  // used for link & books
  linkedTo?: { id: string; label?: string; rx_model: RxModel }[]
  unlinkedTo?: { id: string; label?: string; rx_model: RxModel }[]
  fetchedMetadata?: boolean
  /** True when this book or collection was synced but metadata could not be refreshed (link uses different connector/credentials). */
  hasDifferentProviderCredentials?: boolean
  added?: boolean
  updated?: boolean
  deleted?: boolean
}

export type SyncReportPostgresEntityShared = {
  created_at: string
  ended_at: string
  state: "success" | "error"
  report: ReportEntry[]
  datasource_id: string
  user_name: string
  /** True when at least one book or collection was synced but could not be refreshed because it uses a different link/connector. */
  has_different_provider_credentials?: boolean
}

export type SyncReportPostgresEntitiesShared = SyncReportPostgresEntityShared[]
