import type { DataSourceEditFormProps } from "../types"
import { DataSourceForm } from "./sync/DataSourceForm"

export function DataSourceEditForm({
  dataSource,
  onSubmit,
}: DataSourceEditFormProps<"one-drive">) {
  return (
    <DataSourceForm
      dataSource={dataSource}
      onSubmit={onSubmit}
      submitLabel="Save"
    />
  )
}
