/**
 * @see https://github.com/dropbox/dropbox-sdk-js/tree/main/examples/javascript/download
 */
import type {
  DataSourcePlugin,
  SynchronizeAbleItem,
} from "src/lib/plugins/types"
import {
  explodeWebdavResourceId,
  generateWebdavResourceId,
  getWebdavSyncData,
  WebDAVDataSourceDocType,
} from "@oboku/shared"
import { type createClient } from "webdav"
import { getDataSourceData } from "../helpers"

// @important needs "node-domexception" which did not seem to be installed by default
async function getWebdavModule(): Promise<{
  createClient: typeof createClient
}> {
  return await import("webdav")
}

export const dataSource: DataSourcePlugin = {
  type: "webdav" satisfies WebDAVDataSourceDocType["type"],
  getFileMetadata: async ({ link, data }) => {
    const syncData = getWebdavSyncData(data ?? {})

    const webdav = await getWebdavModule()
    const client = webdav.createClient(syncData.url, {
      username: syncData.username,
      password: syncData.password,
    })
    const { filename } = explodeWebdavResourceId(link.resourceId)

    const response = await client.stat(filename, {
      details: true,
    })

    if ("data" in response) {
      return {
        canDownload: true,
        contentType: response.data.mime,
        name: response.data.basename,
        modifiedAt: response.data.lastmod,
      }
    }

    throw new Error("File not found")
  },
  getFolderMetadata: async ({ link, data }) => {
    const syncData = getWebdavSyncData(data ?? {})
    const webdav = await getWebdavModule()
    const client = webdav.createClient(syncData.url, {
      username: syncData.username,
      password: syncData.password,
    })
    const { filename } = explodeWebdavResourceId(link.resourceId)

    const response = await client.stat(filename, {
      details: true,
    })

    if ("data" in response) {
      return {
        name: response.data.basename,
        modifiedAt: response.data.lastmod,
      }
    }

    throw new Error("Folder not found")
  },
  download: async (link, data) => {
    const syncData = getWebdavSyncData(data ?? {})
    const webdav = await getWebdavModule()
    const client = webdav.createClient(syncData.url, {
      username: syncData.username,
      password: syncData.password,
    })
    const { filename } = explodeWebdavResourceId(link.resourceId)

    return {
      stream: client.createReadStream(filename),
    }
  },
  sync: async ({ data, dataSourceId, db }) => {
    const { connectorId, directory: rootDirectory = "/" } =
      (await getDataSourceData<"webdav">({
        db,
        dataSourceId,
      })) ?? {}

    const syncData = getWebdavSyncData(data ?? {})

    if (!connectorId || !syncData.url || !syncData.username) {
      throw new Error("datasource not found or invalid")
    }

    const webdav = await getWebdavModule()

    const client = webdav.createClient(syncData.url, {
      username: syncData.username,
      password: syncData.password,
    })

    const reduceItems = async (
      directory: string,
    ): Promise<SynchronizeAbleItem[]> => {
      const files = await client.getDirectoryContents(directory)

      if (!Array.isArray(files)) {
        return []
      }

      return await files.reduce(
        async (acc: Promise<SynchronizeAbleItem[]>, file) => {
          if (file.type === "file") {
            return [
              ...(await acc),
              {
                type: file.type,
                modifiedAt: file.lastmod,
                name: file.basename,
                linkData: {
                  connectorId,
                },
                resourceId: generateWebdavResourceId({
                  filename: file.filename,
                  url: syncData.url,
                }),
              } satisfies SynchronizeAbleItem,
            ]
          }

          return [
            ...(await acc),
            {
              type: "folder",
              modifiedAt: file.lastmod,
              name: file.basename,
              linkData: {
                connectorId,
              },
              resourceId: generateWebdavResourceId({
                filename: file.filename,
                url: syncData.url,
              }),
              items: await reduceItems(file.filename),
            } satisfies SynchronizeAbleItem,
          ]
        },
        Promise.resolve([]),
      )
    }

    const items = await reduceItems(rootDirectory)

    return {
      name: rootDirectory,
      items,
    }
  },
}
