import type { DeepReadonly } from "rxdb"
import type { DataSourceDocType } from "@oboku/shared"
import { plugins } from "../plugins/configure"
import { useDataSource } from "./useDataSource"

/**
 * By priority
 * `name` -> `plugin.infer` -> `plugin.name`
 */
export const useDataSourceLabel = (
  dataSource?: DeepReadonly<DataSourceDocType> | null,
) => {
  const { data } = useDataSource(dataSource?._id)
  const pluginForDataSource = plugins.find(
    (plugin) => plugin.type === dataSource?.type,
  )

  const label = plugins.reduce((acc, plugin) => {
    // biome-ignore lint/correctness/useHookAtTopLevel: Expected
    const data = plugin.useSyncSourceInfo?.(
      dataSource?.type === plugin.type ? dataSource : undefined,
    )

    if (plugin.type === dataSource?.type) {
      return acc || data?.name
    }

    return acc
  }, data?.name)

  return label || pluginForDataSource?.name
}
