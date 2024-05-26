import request from "request"
import { DataSourcePlugin } from "@libs/plugins/types"

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
  getMetadata: async ({ id }) => {
    const filename = extractNameFromUri(id)

    return { name: filename, canDownload: true }
  },
  download: async (link) => {
    const downloadLink = extractIdFromResourceId(link.resourceId)

    return {
      metadata: (await dataSource.getMetadata({ id: link.resourceId })) ?? {},
      // @todo request is deprecated, switch to something else
      // @see https://github.com/request/request/issues/3143
      stream: request({ uri: downloadLink })
    }
  },
  sync: async () => ({ items: [], name: "" })
}
