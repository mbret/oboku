import { memo } from "react"
import type { DataSourceFormData } from "../types"
import type { Control, UseFormWatch } from "react-hook-form"
import { DataSourceForm } from "./DataSourceForm"

export const DataSourceDetails = memo(
  (props: {
    control: Control<DataSourceFormData, any, DataSourceFormData>
    watch: UseFormWatch<DataSourceFormData>
  }) => {
    return <DataSourceForm {...props} />
  },
)
