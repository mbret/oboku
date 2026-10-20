import type { UseSynchronizeHook } from "../types"
import { createConnectorSynchronize } from "../common/createConnectorSynchronize"

export const useSynchronize: UseSynchronizeHook<"synology-drive"> =
  createConnectorSynchronize("synology-drive")
