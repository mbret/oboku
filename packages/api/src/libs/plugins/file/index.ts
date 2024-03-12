import { DataSourcePlugin } from "@libs/plugins/types"
import { PLUGIN_FILE_TYPE, PLUGIN_FILE_DATA } from "@oboku/shared"

export const plugin: DataSourcePlugin = {
  type: PLUGIN_FILE_TYPE,
  getMetadata: async ({ data }) => {
    if (typeof data === "object") {
      const validData = data as PLUGIN_FILE_DATA

      return { name: validData?.filename ?? "", shouldDownload: false }
    }

    return { name: "unknown", shouldDownload: false }
  }
}
