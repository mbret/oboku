import type { GetDataSourceLabel } from "../../plugins/types"
import { getLabelWithItemCount } from "../../plugins/common/dataSourceLabel"

export const getDataSourceLabel: GetDataSourceLabel<"DRIVE"> =
  function getGoogleDriveDataSourceLabel(dataSource) {
    const itemsCount = dataSource.data_v2?.items?.length ?? 0

    return getLabelWithItemCount("Google Drive", itemsCount)
  }
