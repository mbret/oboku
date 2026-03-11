import { memo } from "react"
import type { Control, UseFormWatch } from "react-hook-form"
import { DataSourceForm } from "./DataSourceForm"
import type { DataSourceFormData } from "../types"

export const DataSourceDetails = memo(
  (props: {
    control: Control<DataSourceFormData, any, DataSourceFormData>
    watch: UseFormWatch<DataSourceFormData>
  }) => {
    return <DataSourceForm {...props} />
  },
)
