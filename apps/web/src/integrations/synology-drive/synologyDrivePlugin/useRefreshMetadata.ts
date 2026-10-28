import type { ObokuPlugin } from "../../plugins/types"
import { createConnectorRefreshMetadata } from "../../plugins/common/createConnectorRefreshMetadata"

export const useRefreshMetadata: ObokuPlugin<"synology-drive">["useRefreshMetadata"] =
  createConnectorRefreshMetadata("synology-drive")
