import type { UseSynchronizeHook } from "../../plugins/types"
import { createConnectorSynchronize } from "../../plugins/common/createConnectorSynchronize"

export const useSynchronize: UseSynchronizeHook<"server"> =
  createConnectorSynchronize("server")
