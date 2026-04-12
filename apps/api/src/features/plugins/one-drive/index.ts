import { PLUGIN_ONE_DRIVE_TYPE } from "@oboku/shared"
import type { DataSourcePlugin } from "../types"

const unsupported = () => {
  throw new Error("OneDrive server-side sync is not implemented yet")
}

export const dataSource: DataSourcePlugin<"one-drive"> = {
  type: PLUGIN_ONE_DRIVE_TYPE,
  getCollectionCandidatesForItem: async () => ({ collections: [] }),
  getFileMetadata: async () => unsupported(),
  getFolderMetadata: async () => unsupported(),
  getLinkCandidatesForItem: async () => ({ links: [] }),
  download: async () => unsupported(),
  sync: async () => unsupported(),
}
