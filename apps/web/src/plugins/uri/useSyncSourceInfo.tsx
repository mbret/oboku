import type { UseSyncSourceInfo } from "../types"

export const useSyncSourceInfo: UseSyncSourceInfo<"URI"> = ({
  dataSource,
  enabled,
}) => {
  const uriDataSource =
    enabled && dataSource?.type === "URI" ? dataSource : undefined

  if (!uriDataSource) {
    return {
      name: undefined,
    }
  }

  return {
    name: uriDataSource.data_v2?.allowSelfSigned
      ? "URL (self-signed allowed)"
      : "URL",
  }
}
