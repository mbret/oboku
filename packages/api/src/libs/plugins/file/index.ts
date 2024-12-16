import { DataSourcePlugin } from "@libs/plugins/types"
import { PLUGIN_FILE_TYPE } from "@oboku/shared"

export const plugin: DataSourcePlugin = {
  type: PLUGIN_FILE_TYPE,
  getMetadata: async ({ data }) => {
    const { filename = "" } = data ?? {}

    return {
      name: filename,
      canDownload: false,
      bookMetadata: {
        title: filename
      }
    }
  }
}
