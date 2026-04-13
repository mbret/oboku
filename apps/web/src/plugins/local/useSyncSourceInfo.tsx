import type { UseSyncSourceInfo } from "../types"

export const useSyncSourceInfo: UseSyncSourceInfo<"file"> = ({
  enabled,
  dataSource,
}) => {
  return {
    name: enabled && !!dataSource ? "On device" : undefined,
  }
}
