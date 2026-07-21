import type { ObokuPlugin } from "../types"
import { createConnectorRefreshMetadata } from "../common/createConnectorRefreshMetadata"

export const useRefreshMetadata: ObokuPlugin<"server">["useRefreshMetadata"] =
  createConnectorRefreshMetadata("server")
