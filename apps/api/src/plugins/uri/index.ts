import { type DataSourcePlugin, MODIFIED_AT_UNSUPPORTED } from "../types.js"
import { findCandidates } from "../helpers.js"
import axios from "axios"
import { getUserAddressRequestOptions } from "../../lib/http/userAddressAgents.js"

const URI_TYPE = "URI"

const extractNameFromUrl = (url: string) => {
  return url.substring(url.lastIndexOf("/") + 1) || "unknown"
}

function resolveUrl(link: { data: { url: string } }): string {
  const { url } = link.data

  if (!url) {
    throw new Error("URI link is missing url")
  }

  return url
}

export const dataSource: DataSourcePlugin<"URI"> = {
  type: URI_TYPE,
  getLinkCandidatesForItem: async (item, ctx) => ({
    links: await findCandidates(ctx, "link", {
      type: URI_TYPE,
      data: { url: item.linkData.url },
    }),
  }),
  getCollectionCandidatesForItem: async (item, ctx) => ({
    collections: await findCandidates(ctx, "obokucollection", {
      type: URI_TYPE,
      data: { url: item.linkData.url },
    }),
  }),
  getFolderMetadata: async ({ link }) => {
    const url = resolveUrl(link)

    return { name: extractNameFromUrl(url) }
  },
  getFileMetadata: async ({ link }) => {
    const url = resolveUrl(link)

    return {
      name: extractNameFromUrl(url),
      canDownload: true,
      modifiedAt: MODIFIED_AT_UNSUPPORTED,
    }
  },
  download: async (link) => {
    const url = resolveUrl(link)
    const { allowSelfSigned } = link.data

    const response = await axios.get(url, {
      responseType: "stream",
      ...getUserAddressRequestOptions({ allowSelfSigned }),
    })

    return {
      stream: response.data,
    }
  },
  sync: async () => ({ items: [], name: "" }),
}
