import type { GetDataSourceLabel } from "../types"

export const getDataSourceLabel: GetDataSourceLabel<"file"> =
  function getLocalDataSourceLabel() {
    return "On device"
  }
