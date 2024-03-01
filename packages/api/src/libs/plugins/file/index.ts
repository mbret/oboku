import { DataSourcePlugin } from "@libs/plugins/types"
import { PLUGIN_FILE_TYPE, PLUGIN_FILE_DATA } from "@oboku/shared"
import path from "path"

export const plugin: DataSourcePlugin = {
  type: PLUGIN_FILE_TYPE,
  getMetadata: async (link) => {
    const data = link.data

    if (typeof data === "object") {
      const validData = data as PLUGIN_FILE_DATA

      const parsedFilename = path.parse(validData?.filename ?? "")

      return { title: parsedFilename.name, shouldDownload: false }
    }

    return { title: "unknown", shouldDownload: false }
  }
}
