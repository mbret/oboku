import { DataSourceForm } from "./lib/DataSourceForm"
import type { DataSourceFormData } from "../types"
import type { Control } from "react-hook-form"

export const DataSourceNew = ({
  control,
}: {
  control: Control<DataSourceFormData, any, DataSourceFormData>
}) => {
  return <DataSourceForm control={control} />
}
