import type { DataSourcePlugin } from "src/features/plugins/types"
import { find } from "src/lib/couch/dbHelpers"
import axios from "axios"
import { getHttpsAgent } from "src/lib/http/httpsAgent"

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
  getLinkCandidatesForItem: async (item, ctx) => {
    const links = await find(ctx.db, "link", {
      selector: { type: URI_TYPE, data: { url: item.linkData.url } },
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
        linkType: URI_TYPE,
        linkData: { url: item.linkData.url },
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
    const url = resolveUrl(link)

    return { name: extractNameFromUrl(url) }
  },
  getFileMetadata: async ({ link }) => {
    const url = resolveUrl(link)

    return { name: extractNameFromUrl(url), canDownload: true }
  },
  download: async (link) => {
    const url = resolveUrl(link)
    const { allowSelfSigned } = link.data

    const response = await axios.get(url, {
      responseType: "stream",
      httpsAgent: getHttpsAgent(allowSelfSigned),
    })

    return {
      stream: response.data,
    }
  },
  sync: async () => ({ items: [], name: "" }),
}
