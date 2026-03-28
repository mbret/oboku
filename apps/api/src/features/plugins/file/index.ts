import type { DataSourcePlugin } from "src/features/plugins/types"
import { find } from "src/lib/couch/dbHelpers"
import { getFileLinkData, PLUGIN_FILE_TYPE } from "@oboku/shared"

export const plugin: DataSourcePlugin<"file"> = {
  type: PLUGIN_FILE_TYPE,
  getLinkCandidatesForItem: async (item, ctx) => {
    const links = await find(ctx.db, "link", {
      selector: { type: PLUGIN_FILE_TYPE, resourceId: item.resourceId },
    })
    return {
      links: links.map((link) => ({
        ...link,
        isUsingSameProviderCredentials: true,
      })),
    }
  },
  getCollectionCandidatesForItem: async (item, ctx) => {
    const collections = await find(ctx.db, "obokucollection", {
      selector: {
        linkType: PLUGIN_FILE_TYPE,
        linkResourceId: item.resourceId,
      },
    })
    return {
      collections: collections.map((c) => ({
        ...c,
        isUsingSameProviderCredentials: true,
      })),
    }
  },
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
  download: async () => {
    throw new Error("file plugin does not support download")
  },
  sync: async () => {
    throw new Error("file plugin does not support sync")
  },
}
