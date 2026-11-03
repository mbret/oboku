import type { GetDataSourceLabel } from "../../plugins/types"
import {
  getHostname,
  getLabelWithItemCount,
} from "../../plugins/common/dataSourceLabel"

export const getDataSourceLabel: GetDataSourceLabel<"synology-drive"> =
  function getSynologyDriveDataSourceLabel(dataSource, connector) {
    const itemsCount = dataSource.data_v2?.items?.length ?? 0
    const hostname = connector ? getHostname(connector.url) : undefined

    if (!connector || !hostname) {
      return getLabelWithItemCount("Synology Drive", itemsCount)
    }

    return getLabelWithItemCount(
      `synology://${connector.username}@${hostname}`,
      itemsCount,
    )
  }
