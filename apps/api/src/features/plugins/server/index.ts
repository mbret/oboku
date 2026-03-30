import { PLUGIN_SERVER_TYPE } from "@oboku/shared"
import type {
  DataSourcePlugin,
  PluginMetadataParams,
} from "src/features/plugins/types"
import type { WebDAVClient } from "webdav"
import { getConnectorById } from "src/lib/connectors/connectorHelpers"
import { getDataSourceData } from "../helpers"
import {
  getWebdavModule,
  getFileMetadataFromWebdav,
  getFolderMetadataFromWebdav,
  downloadFromWebdav,
  walkDirectoryContents,
} from "../webdav/operations"
import { find } from "src/lib/couch/dbHelpers"

async function createServerWebdavClient(
  db: Parameters<typeof getConnectorById>[0],
  connectorId: string,
  password: string,
): Promise<WebDAVClient> {
  const connector = await getConnectorById(db, connectorId, "server")

  if (!connector) {
    throw new Error("Server connector not found")
  }

  const webdav = await getWebdavModule()

  return webdav.createClient(`http://localhost:${process.env.PORT}/webdav`, {
    username: connector.username,
    password,
  })
}

async function resolveClientAndPath(
  params: Pick<
    PluginMetadataParams<"server">,
    "link" | "providerCredentials" | "db"
  >,
): Promise<{ client: WebDAVClient; filePath: string }> {
  const { link, providerCredentials, db } = params
  const connectorId = link.data?.connectorId

  if (!connectorId || !providerCredentials || !db) {
    throw new Error("Server credentials (password) and connector are required")
  }

  const client = await createServerWebdavClient(
    db,
    connectorId,
    providerCredentials.password,
  )

  const filePath = link.data?.filePath

  if (!filePath) {
    throw new Error("Server link is missing filePath")
  }

  return { client, filePath }
}

export const dataSource: DataSourcePlugin<"server"> = {
  type: PLUGIN_SERVER_TYPE,
  getLinkCandidatesForItem: async (item, ctx) => {
    const { connectorId, filePath } = item.linkData

    if (!connectorId) return { links: [] }

    const datasourceConnectorId =
      ctx.dataSource.type === "server"
        ? ctx.dataSource.data_v2?.connectorId
        : undefined

    const links = await find(ctx.db, "link", {
      selector: {
        type: PLUGIN_SERVER_TYPE,
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
      ctx.dataSource.type === PLUGIN_SERVER_TYPE
        ? ctx.dataSource.data_v2?.connectorId
        : undefined

    const collections = await find(ctx.db, "obokucollection", {
      selector: {
        linkType: PLUGIN_SERVER_TYPE,
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
  getFolderMetadata: async (params) => {
    const { client, filePath } = await resolveClientAndPath(params)

    return getFolderMetadataFromWebdav(client, filePath)
  },
  getFileMetadata: async (params) => {
    const { client, filePath } = await resolveClientAndPath(params)

    return getFileMetadataFromWebdav(client, filePath)
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
    const { connectorId } =
      (await getDataSourceData<"server">({ db, dataSourceId })) ?? {}

    if (!connectorId || !providerCredentials?.password) {
      throw new Error("datasource not found or invalid")
    }

    const client = await createServerWebdavClient(
      db,
      connectorId,
      providerCredentials.password,
    )

    const items = await walkDirectoryContents(client, "/", connectorId)

    return { items }
  },
}
