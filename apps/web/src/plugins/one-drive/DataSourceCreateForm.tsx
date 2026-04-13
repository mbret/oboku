import type { DataSourceCreateFormProps } from "../types"
import { DataSourceForm } from "./sync/DataSourceForm"

export function DataSourceCreateForm({ onSubmit }: DataSourceCreateFormProps) {
  return <DataSourceForm onSubmit={onSubmit} submitLabel="Confirm" />
}
