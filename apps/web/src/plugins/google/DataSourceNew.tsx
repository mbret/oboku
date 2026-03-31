import { DataSourceForm } from "./lib/DataSourceForm"
import type { DataSourceCreateFormProps } from "../types"

export const DataSourceNew = ({ onSubmit }: DataSourceCreateFormProps) => {
  return <DataSourceForm onSubmit={onSubmit} submitLabel="Confirm" />
}
