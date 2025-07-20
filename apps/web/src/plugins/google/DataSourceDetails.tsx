import type { Control } from "react-hook-form"
import { DataSourceForm } from "./lib/DataSourceForm"
import type { DataSourceFormData } from "../types"

export const DataSourceDetails = ({
  control,
}: {
  control: Control<DataSourceFormData, any, DataSourceFormData>
}) => {
  return <DataSourceForm control={control} />
}
