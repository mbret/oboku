import type { DataSourcePlugin } from "src/lib/plugins/types"
import { getFileLinkData, PLUGIN_FILE_TYPE } from "@oboku/shared"

export const plugin: DataSourcePlugin = {
  type: PLUGIN_FILE_TYPE,
  getFolderMetadata: async ({ link }) => {
    const { filename = "" } = getFileLinkData(link.data ?? {}) ?? {}

    return {
      name: filename as string,
    }
  },
  getFileMetadata: async ({ link }) => {
    const { filename = "" } = getFileLinkData(link.data ?? {}) ?? {}

    return {
      name: filename as string,
      canDownload: false,
      bookMetadata: {
        title: filename as string,
      },
    }
  },
}
