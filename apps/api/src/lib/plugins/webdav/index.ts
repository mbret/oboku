/**
 * @see https://github.com/dropbox/dropbox-sdk-js/tree/main/examples/javascript/download
 */
import type {
  DataSourcePlugin,
  SynchronizeAbleDataSource,
  SynchronizeAbleItem,
} from "src/lib/plugins/types"
import { WebDAVDataSourceDocType } from "@oboku/shared"
import { FileStat, type createClient } from "webdav"
import { getDataSourceData } from "../helpers"

// @important needs "node-domexception" which did not seem to be installed by default
async function getWebdavModule(): Promise<{
  createClient: typeof createClient
}> {
  return await import("webdav")
}

export const dataSource: DataSourcePlugin = {
  type: "webdav" satisfies WebDAVDataSourceDocType["type"],
  getMetadata: async ({ id, credentials }) => {
    throw new Error("not implemented")
  },
  download: async (link, credentials) => {
    throw new Error("not implemented")
  },
  sync: async ({ data, dataSourceId, db }) => {
    const password =
      data && "password" in data && typeof data.password === "string"
        ? data.password
        : undefined

    if (!password) {
      throw new Error("password is required")
    }

    const dataSourceData = await getDataSourceData<"webdav">({
      db,
      dataSourceId,
    })

    if (!dataSourceData || !dataSourceData.url || !dataSourceData.username) {
      throw new Error("datasource not found")
    }

    const webdav = await getWebdavModule()

    const client = webdav.createClient(dataSourceData.url, {
      username: dataSourceData.username,
      password,
    })

    const rootDirectory = dataSourceData.directory ?? "/"

    const reduceItems = async (directory: string): Promise<SynchronizeAbleItem[]> => {
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
                resourceId: `webdav/${encodeURIComponent(dataSourceData.url ?? "")}/${dataSourceData.username}${file.filename}`,
              } satisfies SynchronizeAbleItem,
            ]
          }

          return [
            ...(await acc),
            {
              type: "folder",
              modifiedAt: file.lastmod,
              name: file.basename,
              resourceId: `webdav://${dataSourceData.username}@${dataSourceData.url ?? ""}${file.filename}`,
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
