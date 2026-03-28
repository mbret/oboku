import type { DataSourcePlugin } from "src/features/plugins/types"
import { find } from "src/lib/couch/dbHelpers"
import axios from "axios"
import { getUriLinkData, explodeUriResourceId } from "@oboku/shared"
import { getHttpsAgent } from "src/lib/http/httpsAgent"

const URI_TYPE = "URI"

const extractNameFromUri = (resourceId: string) => {
  const { url: downloadLink } = explodeUriResourceId(resourceId)
  return downloadLink.substring(downloadLink.lastIndexOf("/") + 1) || "unknown"
}

export const dataSource: DataSourcePlugin<"URI"> = {
  type: URI_TYPE,
  getLinkCandidatesForItem: async (item, ctx) => {
    const links = await find(ctx.db, "link", {
      selector: { type: URI_TYPE, resourceId: item.resourceId },
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
    const filename = extractNameFromUri(link.resourceId)

    return { name: filename }
  },
  getFileMetadata: async ({ link }) => {
    const filename = extractNameFromUri(link.resourceId)

    return { name: filename, canDownload: true }
  },
  download: async (link) => {
    const { url: downloadLink } = explodeUriResourceId(link.resourceId)
    const { allowSelfSigned } = getUriLinkData(link.data ?? {})

    const response = await axios.get(downloadLink, {
      responseType: "stream",
      httpsAgent: getHttpsAgent(allowSelfSigned),
    })

    return {
      stream: response.data,
    }
  },
  sync: async () => ({ items: [], name: "" }),
}
