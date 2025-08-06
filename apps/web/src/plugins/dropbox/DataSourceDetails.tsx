import type { DataSourceFormData } from "../types"
import type { Control, UseFormWatch } from "react-hook-form"
import { AddDataSource } from "./AddDataSource"

export const DataSourceDetails = (props: {
  control: Control<DataSourceFormData, any, DataSourceFormData>
  watch: UseFormWatch<DataSourceFormData>
}) => {
  return <AddDataSource {...props} />
}
