import type { DataSourcePlugin } from "src/lib/plugins/types"
import { find } from "src/lib/couch/dbHelpers"
import axios from "axios"
import type { IncomingMessage } from "node:http"

export type UriLinkData = { uri?: string }

const UNIQUE_RESOURCE_ID = `oboku-link`
const URI_TYPE = "URI"

const extractIdFromResourceId = (resourceId: string) =>
  resourceId.replace(`${UNIQUE_RESOURCE_ID}-`, ``)

const extractNameFromUri = (resourceId: string) => {
  const downloadLink = extractIdFromResourceId(resourceId)
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
    const downloadLink = extractIdFromResourceId(link.resourceId)

    const response = await axios.get(downloadLink, {
      responseType: "stream",
    })

    return {
      // @todo request is deprecated, switch to something else
      // @see https://github.com/request/request/issues/3143
      stream: response.data as IncomingMessage,
    }
  },
  sync: async () => ({ items: [], name: "" }),
}
