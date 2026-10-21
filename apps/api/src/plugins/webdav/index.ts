/**
 * @see https://github.com/dropbox/dropbox-sdk-js/tree/main/examples/javascript/download
 */
import type { DataSourcePlugin } from "../types.js"
import {
  getDataFromDataSource,
  type WebDAVDataSourceDocType,
} from "@oboku/shared"
import { AuthType, createClient } from "webdav"
import { getUserAddressRequestOptions } from "../../lib/http/userAddressAgents.js"
import { getConnectorById } from "../../lib/connectors/connectorHelpers.js"
import {
  getFileMetadataFromWebdav,
  getFolderMetadataFromWebdav,
  downloadFromWebdav,
  walkDirectoryContents,
} from "./operations.js"
import { findConnectorCandidates } from "../helpers.js"

const WEBDAV_TYPE = "webdav" satisfies WebDAVDataSourceDocType["type"]

async function resolveClientAndPath(params: {
  link: { data: { connectorId?: string; filePath?: string } }
  providerCredentials?: { password: string } | null
  db?: Parameters<typeof getConnectorById>[0]
}) {
  const { link, providerCredentials, db } = params
  const connectorId = link.data.connectorId
  const filePath = link.data.filePath

  if (!connectorId || !filePath || !providerCredentials || !db) {
    throw new Error(
      "WebDAV credentials (password), connector, and filePath are required",
    )
  }

  const connector = await getConnectorById(db, connectorId, "webdav")

  if (!connector) {
    throw new Error("WebDAV connector not found")
  }

  const client = createWebdavClient({
    ...connector,
    password: providerCredentials.password,
  })

  return { client, filePath }
}

const createWebdavClient = (connector: {
  allowSelfSigned?: boolean
  password: string
  url: string
  username: string
}) =>
  createClient(connector.url, {
    username: connector.username,
    password: connector.password,
    authType: AuthType.Auto,
    ...getUserAddressRequestOptions({
      allowSelfSigned: connector.allowSelfSigned,
    }),
  })

export const dataSource: DataSourcePlugin<"webdav"> = {
  type: WEBDAV_TYPE,
  getLinkCandidatesForItem: async (item, ctx) => ({
    links: await findConnectorCandidates(ctx, "link", {
      type: WEBDAV_TYPE,
      data: {
        connectorId: item.linkData.connectorId,
        filePath: item.linkData.filePath,
      },
    }),
  }),
  getCollectionCandidatesForItem: async (item, ctx) => ({
    collections: await findConnectorCandidates(ctx, "obokucollection", {
      type: WEBDAV_TYPE,
      data: {
        connectorId: item.linkData.connectorId,
        filePath: item.linkData.filePath,
      },
    }),
  }),
  getFileMetadata: async ({ link, providerCredentials, db }) => {
    const { client, filePath } = await resolveClientAndPath({
      link,
      providerCredentials,
      db,
    })

    return getFileMetadataFromWebdav(client, filePath)
  },
  getFolderMetadata: async ({ link, providerCredentials, db }) => {
    const { client, filePath } = await resolveClientAndPath({
      link,
      providerCredentials,
      db,
    })

    return getFolderMetadataFromWebdav(client, filePath)
  },
  download: async (link, providerCredentials, db) => {
    const { client, filePath } = await resolveClientAndPath({
      link,
      providerCredentials,
      db,
    })

    return downloadFromWebdav(client, filePath)
  },
  sync: async (options) => {
    const { providerCredentials, dataSource, db } = options
    const { connectorId, directory } =
      getDataFromDataSource<"webdav">(dataSource) ?? {}

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

    const items = await walkDirectoryContents(
      client,
      rootDirectory,
      connectorId,
    )

    return {
      name: rootDirectory,
      items,
    }
  },
}
