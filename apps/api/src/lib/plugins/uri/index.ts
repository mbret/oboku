import type { DataSourcePlugin } from "src/lib/plugins/types"
import axios from "axios"
import type { IncomingMessage } from "node:http"

export type UriLinkData = { uri?: string }

const UNIQUE_RESOURCE_ID = `oboku-link`

const extractIdFromResourceId = (resourceId: string) =>
  resourceId.replace(`${UNIQUE_RESOURCE_ID}-`, ``)

const extractNameFromUri = (resourceId: string) => {
  const downloadLink = extractIdFromResourceId(resourceId)
  return downloadLink.substring(downloadLink.lastIndexOf("/") + 1) || "unknown"
}

export const dataSource: DataSourcePlugin = {
  type: `URI`,
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
