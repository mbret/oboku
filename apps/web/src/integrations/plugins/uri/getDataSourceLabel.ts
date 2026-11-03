import type { GetDataSourceLabel } from "../types"

export const getDataSourceLabel: GetDataSourceLabel<"URI"> =
  function getUriDataSourceLabel(dataSource) {
    return dataSource.data_v2?.allowSelfSigned
      ? "URL (self-signed allowed)"
      : "URL"
  }
