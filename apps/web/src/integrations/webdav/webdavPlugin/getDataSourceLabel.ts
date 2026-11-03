import type { GetDataSourceLabel } from "../../plugins/types"
import { getHostname } from "../../plugins/common/dataSourceLabel"

export const getDataSourceLabel: GetDataSourceLabel<"webdav"> =
  function getWebdavDataSourceLabel(dataSource, connector) {
    const directory = dataSource.data_v2?.directory ?? "/"
    const hostname = connector ? getHostname(connector.url) : undefined

    if (!connector || !hostname) {
      return `webdav://?`
    }

    return `webdav://${connector.username}@${hostname}${directory}`
  }
