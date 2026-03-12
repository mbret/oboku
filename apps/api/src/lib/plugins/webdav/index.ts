/**
 * @see https://github.com/dropbox/dropbox-sdk-js/tree/main/examples/javascript/download
 */
import {
  type DataSourcePlugin,
  type SynchronizeAbleItem,
} from "src/lib/plugins/types"
import { find } from "src/lib/couch/dbHelpers"
import {
  getConnectorById,
  getConnectorIdsWithSameServer,
} from "../../connectors/connectorHelpers"
import {
  explodeWebdavResourceId,
  generateWebdavResourceId,
  isFileSupported,
  isCollectionOfType,
  normalizeWebdavBaseUrl,
  WebDAVDataSourceDocType,
} from "@oboku/shared"
import { type createClient } from "webdav"
import { getDataSourceData } from "../helpers"
import { getHttpsAgent } from "../../http/httpsAgent"

// @important needs "node-domexception" which did not seem to be installed by default
async function getWebdavModule(): Promise<{
  createClient: typeof createClient
}> {
  return await import("webdav")
}

const WEBDAV_TYPE = "webdav" satisfies WebDAVDataSourceDocType["type"]

const createWebdavClient = async (connector: {
  allowSelfSigned?: boolean
  password: string
  url: string
  username: string
}) => {
  const webdav = await getWebdavModule()

  return webdav.createClient(connector.url, {
    username: connector.username,
    password: connector.password,
    httpsAgent: getHttpsAgent(connector.allowSelfSigned),
  })
}

export const dataSource: DataSourcePlugin<"webdav"> = {
  type: WEBDAV_TYPE,
  /**
   * Finds link candidates by resourceId and by "same WebDAV server": we include links whose
   * connector points to the same server URL (normalized). So if the user added the same server
   * as multiple connectors, we still match the item to any of those links.
   */
  getLinkCandidatesForItem: async (item, ctx) => {
    const connectorId = item.linkData.connectorId
    if (!connectorId) {
      return { links: [] }
    }
    const connectorIdsWithSameUrl = await getConnectorIdsWithSameServer(
      ctx.db,
      {
        connectorId,
        connectorType: "webdav",
        normalizeUrl: normalizeWebdavBaseUrl,
      },
    )
    if (!connectorIdsWithSameUrl) {
      return { links: [] }
    }
    const links = await find(ctx.db, "link", {
      selector: {
        type: WEBDAV_TYPE,
        resourceId: item.resourceId,
        data: { connectorId: { $in: connectorIdsWithSameUrl } },
      },
    })
    const datasourceData = ctx.dataSource

    const datasourceConnectorId =
      datasourceData.type === "webdav"
        ? datasourceData.data_v2?.connectorId
        : null

    return {
      links: links.map((link) => {
        const linkConnectorId =
          link.type === "webdav" ? link.data?.connectorId : null

        return {
          ...link,
          isUsingSameProviderCredentials:
            linkConnectorId === datasourceConnectorId,
        }
      }),
    }
  },
  /**
   * Finds collection candidates by resourceId and by "same WebDAV server": we
   * include collections whose linkData.connectorId points to the same server
   * URL (normalized), matching getLinkCandidatesForItem behavior.
   */
  getCollectionCandidatesForItem: async (item, ctx) => {
    const connectorId = item.linkData.connectorId
    if (!connectorId) {
      return { collections: [] }
    }
    const connectorIdsWithSameUrl = await getConnectorIdsWithSameServer(
      ctx.db,
      {
        connectorId,
        connectorType: "webdav",
        normalizeUrl: normalizeWebdavBaseUrl,
      },
    )
    if (!connectorIdsWithSameUrl) {
      return { collections: [] }
    }
    const collections = await find(ctx.db, "obokucollection", {
      selector: {
        linkType: WEBDAV_TYPE,
        linkResourceId: item.resourceId,
        linkData: { connectorId: { $in: connectorIdsWithSameUrl } },
      },
    })
    const datasourceData = ctx.dataSource
    const datasourceConnectorId =
      datasourceData.type === "webdav"
        ? datasourceData.data_v2?.connectorId
        : undefined
    return {
      collections: collections.map((c) => {
        const collectionConnectorId = isCollectionOfType(c, WEBDAV_TYPE)
          ? (c.linkData?.connectorId ?? null)
          : null
        return {
          ...c,
          isUsingSameProviderCredentials:
            collectionConnectorId === datasourceConnectorId,
        }
      }),
    }
  },
  getFileMetadata: async ({ link, providerCredentials, db }) => {
    const connectorId = link.data?.connectorId
    if (!connectorId || !providerCredentials || !db) {
      throw new Error(
        "WebDAV credentials (password) and connector are required",
      )
    }
    const connector = await getConnectorById(db, connectorId, "webdav")
    if (!connector) {
      throw new Error("WebDAV connector not found")
    }
    const client = await createWebdavClient({
      ...connector,
      password: providerCredentials.password,
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
  getFolderMetadata: async ({ link, providerCredentials, db }) => {
    const connectorId = link.data?.connectorId
    if (!connectorId || !providerCredentials || !db) {
      throw new Error(
        "WebDAV credentials (password) and connector are required",
      )
    }
    const connector = await getConnectorById(db, connectorId, "webdav")
    if (!connector) {
      throw new Error("WebDAV connector not found")
    }
    const client = await createWebdavClient({
      ...connector,
      password: providerCredentials.password,
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
  download: async (link, providerCredentials, db) => {
    const connectorId = link.data?.connectorId
    if (!connectorId || !providerCredentials || !db) {
      throw new Error(
        "WebDAV credentials (password) and connector are required",
      )
    }
    const connector = await getConnectorById(db, connectorId, "webdav")
    if (!connector) {
      throw new Error("WebDAV connector not found")
    }
    const client = await createWebdavClient({
      ...connector,
      password: providerCredentials.password,
    })
    const { filename } = explodeWebdavResourceId(link.resourceId)

    return {
      stream: client.createReadStream(filename),
    }
  },
  sync: async (options) => {
    const { providerCredentials, dataSourceId, db } = options
    const { connectorId, directory } =
      (await getDataSourceData<"webdav">({
        db,
        dataSourceId,
      })) ?? {}

    const rootDirectory = `/${directory ?? ""}`

    if (!connectorId || !providerCredentials?.password) {
      throw new Error("datasource not found or invalid")
    }

    const connector = await getConnectorById(db, connectorId, "webdav")
    if (!connector) {
      throw new Error("WebDAV connector not found")
    }
    const client = await createWebdavClient({
      ...connector,
      password: providerCredentials.password,
    })

    const reduceItems = async (
      directory: string,
    ): Promise<SynchronizeAbleItem<"webdav">[]> => {
      const files = await client.getDirectoryContents(directory)

      if (!Array.isArray(files)) {
        return []
      }

      return await files.reduce(
        async (acc: Promise<SynchronizeAbleItem<"webdav">[]>, file) => {
          if (file.type === "file") {
            if (
              !isFileSupported({
                mimeType: file.mime,
                name: file.basename,
              })
            ) {
              return await acc
            }

            return [
              ...(await acc),
              {
                type: file.type,
                modifiedAt: file.lastmod,
                name: file.basename,
                linkData: { connectorId },
                resourceId: generateWebdavResourceId({
                  filename: file.filename,
                }),
              } satisfies SynchronizeAbleItem<"webdav">,
            ]
          }

          const childItems = await reduceItems(file.filename)

          if (childItems.length === 0) {
            return await acc
          }

          return [
            ...(await acc),
            {
              type: "folder",
              modifiedAt: file.lastmod,
              name: file.basename,
              linkData: { connectorId },
              resourceId: generateWebdavResourceId({
                filename: file.filename,
              }),
              items: childItems,
            } satisfies SynchronizeAbleItem<"webdav">,
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
