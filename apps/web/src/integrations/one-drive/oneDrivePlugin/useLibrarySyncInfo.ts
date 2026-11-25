import type { UseLibrarySyncInfo } from "../../plugins/types"
import { getLabelWithLocationCount } from "../../plugins/common/librarySyncLabel"
import { ONE_DRIVE_PLUGIN_NAME } from "./constants"

export const useLibrarySyncInfo: UseLibrarySyncInfo<"one-drive"> = ({
  librarySync,
  enabled,
}) => {
  if (!librarySync || !enabled) {
    return {
      name: undefined,
    }
  }

  const locationsCount = librarySync?.data_v2?.items?.length ?? 0

  return {
    name: getLabelWithLocationCount(ONE_DRIVE_PLUGIN_NAME, locationsCount),
  }
}
