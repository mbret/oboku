import type { UseLibrarySyncInfo } from "../../plugins/types"
import { getLabelWithItemCount } from "../../plugins/common/librarySyncLabel"
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

  const itemsCount = librarySync?.data_v2?.items?.length ?? 0

  return {
    name: getLabelWithItemCount(ONE_DRIVE_PLUGIN_NAME, itemsCount),
  }
}
