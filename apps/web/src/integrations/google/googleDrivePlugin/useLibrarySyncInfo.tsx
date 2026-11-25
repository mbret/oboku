import type { UseLibrarySyncInfo } from "../../plugins/types"
import { getLabelWithItemCount } from "../../plugins/common/librarySyncLabel"

export const useLibrarySyncInfo: UseLibrarySyncInfo<"DRIVE"> = ({
  librarySync,
  enabled,
}) => {
  if (!librarySync || !enabled) {
    return {
      name: undefined,
    }
  }

  const itemsCount = librarySync.data_v2?.items?.length ?? 0

  return {
    name: getLabelWithItemCount("Google Drive", itemsCount),
  }
}
