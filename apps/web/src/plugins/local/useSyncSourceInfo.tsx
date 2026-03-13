import type { UseSyncSourceInfo } from "../types"

export const useSyncSourceInfo: UseSyncSourceInfo<"file"> = ({
  dataSource,
  enabled,
}) => {
  return {
    name: enabled && dataSource?.type === "file" ? "On device" : undefined,
  }
}
