import type { UseSynchronizeHook } from "../types"
import { createConnectorSynchronize } from "../common/createConnectorSynchronize"

export const useSynchronize: UseSynchronizeHook<"opds"> =
  createConnectorSynchronize("opds")
