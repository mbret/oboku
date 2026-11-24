import type { UseLibrarySyncInfo } from "../types"

export const useLibrarySyncInfo: UseLibrarySyncInfo<"URI"> = ({
  librarySync,
  enabled,
}) => {
  if (!librarySync || !enabled) {
    return {
      name: undefined,
    }
  }

  return {
    name: librarySync.data_v2?.allowSelfSigned
      ? "URL (self-signed allowed)"
      : "URL",
  }
}
