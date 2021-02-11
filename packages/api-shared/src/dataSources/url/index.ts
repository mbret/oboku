import request from 'request'
import { DataSource } from '../types'

export type UriLinkData = { uri?: string }

export const dataSource: DataSource = {
  download: async (link) => {
    return new Promise((resolve, reject) => {
      const stream = request({ uri: link.resourceId })
        .on('error', reject)
        .on('response', (response) => {
          resolve({
            stream,
            metadata: {
              ...response.headers['content-length'] && {
                size: response.headers['content-length']
              },
              ...response.headers['content-type'] && {
                contentType: response.headers['content-type']
              }
            },
          })
        })
    })
  },
  sync: async () => ({ items: [], name: '' })
}