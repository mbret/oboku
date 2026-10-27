import type { UseSynchronizeHook } from "../../../plugins/types"
import { createConnectorSynchronize } from "../../../plugins/common/createConnectorSynchronize"

export const useSynchronize: UseSynchronizeHook<"synology-drive"> =
  createConnectorSynchronize("synology-drive")
