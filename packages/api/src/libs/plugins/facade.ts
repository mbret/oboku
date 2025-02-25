import type { LinkDocType } from "@oboku/shared"
import { plugins } from "./plugins"

const urlPlugin = plugins.find(({ type }) => type === `URI`)

export const pluginFacade = {
  getMetadata: async ({
    credentials,
    link,
  }: {
    link: Pick<LinkDocType, "type" | "resourceId" | "data">
    credentials?: any
  }) => {
    const plugin = plugins.find(({ type }) => type === link.type) || urlPlugin

    if (plugin) {
      return await plugin.getMetadata({
        id: link.resourceId,
        credentials,
        data: link.data,
      })
    }

    throw new Error(`No dataSource found for action`)
  },
  download: async (link: LinkDocType, credentials?: any) => {
    const plugin = plugins.find(({ type }) => type === link.type) || urlPlugin

    if (plugin?.download) {
      return plugin.download(link, credentials)
    }

    throw new Error(`No dataSource found for action`)
  },
}
