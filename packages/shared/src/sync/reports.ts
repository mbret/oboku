type RxModel = "link" | "datasource" | "obokucollection" | "tag" | "book"

export type ReportEntry = {
  rx_model: RxModel
  id: string
  label?: string
  // used for link & books
  linkedTo?: { id: string; label?: string; rx_model: RxModel }[]
  unlinkedTo?: { id: string; label?: string; rx_model: RxModel }[]
  fetchedMetadata?: boolean
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
}

export type SyncReportPostgresEntitiesShared = SyncReportPostgresEntityShared[]
