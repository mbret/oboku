import { dataSourcePlugins } from '@oboku/shared/src'
import request from 'request'
import { DataSourcePlugin } from '../types'

export type UriLinkData = { uri?: string }

const UNIQUE_RESOURCE_ID = dataSourcePlugins.URI.uniqueResourceIdentifier

const extractIdFromResourceId = (resourceId: string) => resourceId.replace(`${UNIQUE_RESOURCE_ID}-`, ``)
const extractNameFromUri = (resourceId: string) => {
  const downloadLink = extractIdFromResourceId(resourceId)
  return downloadLink.substring(downloadLink.lastIndexOf('/') + 1) || 'unknown'
}

export const dataSource: DataSourcePlugin = {
  ...dataSourcePlugins.URI,
  getMetadata: async (link) => {
    const filename = extractNameFromUri(link.resourceId)

    return { name: filename, shouldDownload: true }
  },
  download: async (link) => {
    return new Promise(async (resolve, reject) => {
      const downloadLink = extractIdFromResourceId(link.resourceId)

      return resolve({
        metadata: await dataSource.getMetadata(link),
        // @todo request is deprecated, switch to something else
        // @see https://github.com/request/request/issues/3143
        stream: request({ uri: downloadLink })
      })
    })
  },
  sync: async () => ({ items: [], name: '' })
}