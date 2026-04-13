import { DataSourceForm } from "./lib/DataSourceForm"
import type { DataSourceEditFormProps } from "../types"

// The screen matches plugins by dataSource.type, guaranteeing the correct variant.
export const DataSourceDetails = ({
  dataSource,
  onSubmit,
}: DataSourceEditFormProps<"DRIVE">) => {
  return (
    <DataSourceForm
      dataSource={dataSource}
      onSubmit={onSubmit}
      submitLabel="Save"
    />
  )
}
