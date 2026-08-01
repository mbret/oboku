import type { ObokuPlugin } from "../types"
import { createConnectorRefreshMetadata } from "../common/createConnectorRefreshMetadata"

export const useRefreshMetadata: ObokuPlugin<"synology-drive">["useRefreshMetadata"] =
  createConnectorRefreshMetadata("synology-drive")
