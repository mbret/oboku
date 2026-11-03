import type { UseSyncSourceInfo } from "../types"

export const useSyncSourceInfo: UseSyncSourceInfo<"URI"> = ({
  dataSource,
  enabled,
}) => {
  if (!dataSource || !enabled) {
    return {
      name: undefined,
    }
  }

  return {
    name: dataSource.data_v2?.allowSelfSigned
      ? "URL (self-signed allowed)"
      : "URL",
  }
}
