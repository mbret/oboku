import type { GetDataSourceLabel } from "../../plugins/types"

export const getDataSourceLabel: GetDataSourceLabel<"server"> =
  function getServerDataSourceLabel(_dataSource, connector) {
    return connector ? `server://${connector.username}` : undefined
  }
