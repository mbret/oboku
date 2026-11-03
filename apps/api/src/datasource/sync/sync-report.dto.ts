type RxModel = "link" | "datasource" | "obokucollection" | "tag" | "book"

export class SyncReportRelationDto {
  id!: string
  label?: string
  rx_model!: RxModel
}

export class SyncReportEntryDto {
  rx_model!: RxModel
  id!: string
  label?: string
  /** Used for links and books. */
  linkedTo?: SyncReportRelationDto[]
  /** Used for links and books. */
  unlinkedTo?: SyncReportRelationDto[]
  fetchedMetadata?: boolean
  /** True when this book or collection was synced but metadata could not be refreshed (link uses different connector/credentials). */
  hasDifferentProviderCredentials?: boolean
  added?: boolean
  updated?: boolean
  deleted?: boolean
}

export class SyncReportDto {
  id!: number
  created_at!: Date
  ended_at!: Date
  state!: "success" | "error"
  report!: SyncReportEntryDto[]
  datasource_id!: string
  user_name!: string
  /** True when at least one book or collection was synced but could not be refreshed because it uses a different link/connector. */
  has_different_provider_credentials!: boolean | null
}
