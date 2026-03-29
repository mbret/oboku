import type { DataSourceDocType } from "@oboku/shared"
import type { DeepReadonly } from "rxdb"
import { usePluginDataSourceLabel } from "../plugins/usePluginDataSourceLabel"
import { useDataSource } from "./useDataSource"

/**
 * By priority
 * `name` -> `plugin.infer` -> `plugin.name`
 */
export const useDataSourceLabel = (
  dataSource?: DeepReadonly<DataSourceDocType> | null,
) => {
  const { data } = useDataSource(dataSource?._id)
  const pluginLabel = usePluginDataSourceLabel(dataSource)
  const dataSourceName = typeof data?.name === "string" ? data.name.trim() : ""

  if (dataSourceName.length > 0) {
    return dataSourceName
  }

  return pluginLabel ?? "Source"
}
