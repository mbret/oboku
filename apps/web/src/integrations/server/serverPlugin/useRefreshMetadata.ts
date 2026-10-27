import type { ObokuPlugin } from "../../../plugins/types"
import { createConnectorRefreshMetadata } from "../../../plugins/common/createConnectorRefreshMetadata"

export const useRefreshMetadata: ObokuPlugin<"server">["useRefreshMetadata"] =
  createConnectorRefreshMetadata("server")
