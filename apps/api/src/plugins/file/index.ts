import { type DataSourcePlugin, MODIFIED_AT_UNSUPPORTED } from "../types.js"
import { findCandidates } from "../helpers.js"
import { getFileLinkData, PLUGIN_FILE_TYPE } from "@oboku/shared"

export const plugin: DataSourcePlugin<"file"> = {
  type: PLUGIN_FILE_TYPE,
  getLinkCandidatesForItem: async (item, ctx) => ({
    links: await findCandidates(ctx, "link", {
      type: PLUGIN_FILE_TYPE,
      data: { filename: item.linkData.filename },
    }),
  }),
  getCollectionCandidatesForItem: async (item, ctx) => ({
    collections: await findCandidates(ctx, "obokucollection", {
      type: PLUGIN_FILE_TYPE,
      data: { filename: item.linkData.filename },
    }),
  }),
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
      modifiedAt: MODIFIED_AT_UNSUPPORTED,
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
