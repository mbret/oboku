import type { DataSourcePlugin } from "src/lib/plugins/types"
import { PLUGIN_FILE_TYPE } from "@oboku/shared"

export const plugin: DataSourcePlugin = {
  type: PLUGIN_FILE_TYPE,
  getMetadata: async ({ data }) => {
    const { filename = "" } = data ?? {}

    return {
      name: filename as string,
      canDownload: false,
      bookMetadata: {
        title: filename as string,
      },
    }
  },
}
