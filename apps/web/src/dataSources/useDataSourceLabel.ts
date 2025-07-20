import type { DeepReadonly } from "rxdb"
import type { DataSourceDocType } from "@oboku/shared"
import { plugins } from "../plugins/configure"
import { useDataSource } from "./useDataSource"

export const useDataSourceLabel = (
  dataSource?: DeepReadonly<DataSourceDocType>,
) => {
  const { data } = useDataSource(dataSource?._id)

  return plugins.reduce((acc, plugin) => {
    // biome-ignore lint/correctness/useHookAtTopLevel: Expected
    const data = plugin.useSyncSourceInfo?.(
      dataSource?.type === plugin.type ? dataSource : undefined,
    )

    if (plugin.type === dataSource?.type) {
      return data?.name ?? acc
    }

    return acc
  }, data?.name ?? "")
}
