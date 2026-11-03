import type { GetDataSourceLabel } from "../../plugins/types"
import { getLabelWithItemCount } from "../../plugins/common/syncSourceLabel"
import { ONE_DRIVE_PLUGIN_NAME } from "./constants"

export const getDataSourceLabel: GetDataSourceLabel<"one-drive"> =
  function getOneDriveDataSourceLabel(dataSource) {
    const itemsCount = dataSource.data_v2?.items?.length ?? 0

    return getLabelWithItemCount(ONE_DRIVE_PLUGIN_NAME, itemsCount)
  }
