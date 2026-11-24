import type { UseLibrarySyncInfo } from "../types"

export const useLibrarySyncInfo: UseLibrarySyncInfo<"file"> = ({
  enabled,
  librarySync,
}) => {
  return {
    name: enabled && librarySync ? "On device" : undefined,
  }
}
