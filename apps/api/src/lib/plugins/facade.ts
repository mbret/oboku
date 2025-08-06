import type { LinkDocType } from "@oboku/shared"
import { plugins } from "./plugins"

const urlPlugin = plugins.find(({ type }) => type === `URI`)

export const pluginFacade = {
  getFolderMetadata: async ({
    data,
    link,
  }: {
    link: Pick<LinkDocType, "type" | "resourceId" | "data">
    data?: Record<string, unknown>
  }) => {
    const plugin = plugins.find(({ type }) => type === link.type) || urlPlugin

    if (plugin) {
      return await plugin.getFolderMetadata({
        data,
        link,
      })
    }

    throw new Error(`No dataSource found for action`)
  },
  getFileMetadata: async ({
    data,
    link,
  }: {
    link: Pick<LinkDocType, "type" | "resourceId" | "data">
    data?: Record<string, unknown>
  }) => {
    const plugin = plugins.find(({ type }) => type === link.type) || urlPlugin

    if (plugin) {
      return await plugin.getFileMetadata({
        data,
        link,
      })
    }

    throw new Error(`No dataSource found for action`)
  },
  download: async (link: LinkDocType, data?: any) => {
    const plugin = plugins.find(({ type }) => type === link.type) || urlPlugin

    if (plugin?.download) {
      return plugin.download(link, data)
    }

    throw new Error(`No dataSource found for action`)
  },
}
