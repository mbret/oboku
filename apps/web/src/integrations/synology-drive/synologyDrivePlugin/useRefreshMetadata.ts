import type { SourcePlugin } from "../../plugins/types"
import { createConnectorRefreshMetadata } from "../../plugins/common/createConnectorRefreshMetadata"

export const useRefreshMetadata: SourcePlugin<"synology-drive">["useRefreshMetadata"] =
  createConnectorRefreshMetadata("synology-drive")
