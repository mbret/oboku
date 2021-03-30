import { DataSourceType, plugins } from '@oboku/shared/src'
import request from 'request'
import { DataSource } from '../types'

export type UriLinkData = { uri?: string }

const UNIQUE_RESOURCE_ID = plugins[DataSourceType.URI].uniqueResourceIdentifier

const extractIdFromResourceId = (resourceId: string) => resourceId.replace(`${UNIQUE_RESOURCE_ID}-`, ``)
const extractNameFromUri = (resourceId: string) => {
  const downloadLink = extractIdFromResourceId(resourceId)
  return downloadLink.substring(downloadLink.lastIndexOf('/') + 1) || 'unknown'
}

export const dataSource: DataSource = {
  getMetadata: async (link) => {
    const filename = extractNameFromUri(link.resourceId)

    return { name: filename }
  },
  download: async (link) => {
    return new Promise(async (resolve, reject) => {
      const downloadLink = extractIdFromResourceId(link.resourceId)

      return resolve({
        metadata: await dataSource.getMetadata(link),
        stream: request({ uri: downloadLink })
      })
    })
  },
  sync: async () => ({ items: [], name: '' })
}