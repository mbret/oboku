/**
 * @see https://github.com/dropbox/dropbox-sdk-js/tree/main/examples/javascript/download
 */
import type { DataSourcePlugin } from "src/features/plugins/types"
import { type WebDAVDataSourceDocType } from "@oboku/shared"
import { getDataSourceData } from "../helpers"
import { getHttpsAgent } from "src/lib/http/httpsAgent"
import { getConnectorById } from "src/lib/connectors/connectorHelpers"
import {
  getWebdavModule,
  getFileMetadataFromWebdav,
  getFolderMetadataFromWebdav,
  downloadFromWebdav,
  walkDirectoryContents,
} from "./operations"
import { find } from "src/lib/couch/dbHelpers"

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

  const client = await createWebdavClient({
    ...connector,
    password: providerCredentials.password,
  })

  return { client, filePath }
}

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
   * Finds persisted link candidates using the exact stored link identity.
   *
   * Why this is intentionally strict:
   * - A datasource does not own content; it only syncs what it can see.
   * - The same WebDAV resource may legitimately be reachable through multiple
   *   datasources or connectors with different valid credentials.
   * - We must therefore avoid destructive merges across "same server"
   *   connectors, even when their normalized URL matches.
   *
   * Matching rule:
   * - same provider type
   * - same data.filePath
   * - same data.connectorId
   *
   * In other words, "same normalized server" is not enough to treat two links
   * as the same persisted identity. That broader notion may be useful for other
   * convenience flows, but sync candidate reuse must stay exact and
   * non-destructive.
   */
  getLinkCandidatesForItem: async (item, ctx) => {
    const { connectorId, filePath } = item.linkData

    if (!connectorId) return { links: [] }

    const datasourceConnectorId =
      ctx.dataSource.type === "webdav"
        ? ctx.dataSource.data_v2?.connectorId
        : undefined

    const links = await find(ctx.db, "link", {
      selector: {
        type: WEBDAV_TYPE,
        data: { connectorId, filePath },
      },
    })

    return {
      links: links.map((link) => ({
        ...link,
        isUsingSameProviderCredentials: connectorId === datasourceConnectorId,
      })),
    }
  },
  getCollectionCandidatesForItem: async (item, ctx) => {
    const { connectorId, filePath } = item.linkData

    if (!connectorId) return { collections: [] }

    const datasourceConnectorId =
      ctx.dataSource.type === "webdav"
        ? ctx.dataSource.data_v2?.connectorId
        : undefined

    const collections = await find(ctx.db, "obokucollection", {
      selector: {
        linkType: WEBDAV_TYPE,
        linkData: { connectorId, filePath },
      },
    })

    return {
      collections: collections.map((c) => ({
        ...c,
        isUsingSameProviderCredentials: connectorId === datasourceConnectorId,
      })),
    }
  },
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
