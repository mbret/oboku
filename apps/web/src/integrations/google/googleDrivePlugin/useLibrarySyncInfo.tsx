import type { UseLibrarySyncInfo } from "../../plugins/types"
import { getLabelWithLocationCount } from "../../plugins/common/librarySyncLabel"

export const useLibrarySyncInfo: UseLibrarySyncInfo<"DRIVE"> = ({
  librarySync,
  enabled,
}) => {
  if (!librarySync || !enabled) {
    return {
      name: undefined,
    }
  }

  const locationsCount = librarySync.data_v2?.items?.length ?? 0

  return {
    name: getLabelWithLocationCount("Google Drive", locationsCount),
  }
}
