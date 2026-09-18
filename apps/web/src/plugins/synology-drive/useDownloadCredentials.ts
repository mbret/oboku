import { createConnectorDownloadCredentials } from "../common/createConnectorDownloadCredentials"
import type { ObokuPlugin } from "../types"

export const useDownloadCredentials: NonNullable<
  ObokuPlugin<"synology-drive">["useDownloadCredentials"]
> = createConnectorDownloadCredentials("synology-drive")
