import { PLUGIN_SERVER_TYPE } from "@oboku/shared"
import type { DataSourcePlugin } from "src/lib/plugins/types"

export const dataSource: DataSourcePlugin<"server"> = {
  type: PLUGIN_SERVER_TYPE,
  getLinkCandidatesForItem: async () => {
    throw new Error("server plugin: getLinkCandidatesForItem not implemented")
  },
  getCollectionCandidatesForItem: async () => {
    throw new Error(
      "server plugin: getCollectionCandidatesForItem not implemented",
    )
  },
  getFolderMetadata: async () => {
    throw new Error("server plugin: getFolderMetadata not implemented")
  },
  getFileMetadata: async () => {
    throw new Error("server plugin: getFileMetadata not implemented")
  },
  download: async () => {
    throw new Error("server plugin: download not implemented")
  },
  sync: async () => {
    throw new Error("server plugin: sync not implemented")
  },
}
